import { db } from "@/db";
import {
  artistProfiles,
  bookerEvents,
  bookingRequests,
  type BookerEvent,
  type BookingRequest,
} from "@/db/schema";
import { getPublicArtistProfileBySlug } from "@/server/catalog/queries";
import { recordEvent } from "@/server/events/mutations";
import { canManageArtist } from "@/server/identity/authorize";
import { getBookerProfileForUser } from "@/server/identity/queries";
import { and, eq } from "drizzle-orm";

function readString(formData: FormData, key: string) {
  return ((formData.get(key) as string | null) ?? "").trim();
}

function readNullable(formData: FormData, key: string) {
  return readString(formData, key) || null;
}

export async function createBookerEventForUser(
  userId: string,
  formData: FormData,
): Promise<BookerEvent> {
  const profile = await getBookerProfileForUser(userId);
  if (!profile) throw new Error("Create a booker profile before adding events");

  const name = readString(formData, "eventName");
  if (!name) throw new Error("Event name is required");

  const [event] = await db
    .insert(bookerEvents)
    .values({
      bookerProfileId: profile.id,
      name,
      eventType: readString(formData, "eventType") || "show",
      venueName: readNullable(formData, "venueName"),
      market: readNullable(formData, "market"),
      targetDate: readNullable(formData, "targetDate"),
      capacityBand: readNullable(formData, "capacityBand"),
    })
    .returning();

  await recordEvent({
    actorUserId: userId,
    principalType: "booker_profile",
    principalId: profile.id,
    role: "owner",
    action: "booker_event.created",
    correlationId: event.id,
    payload: { eventName: event.name },
  });

  return event;
}

export async function createBookingRequestForUser(
  userId: string,
  formData: FormData,
): Promise<BookingRequest> {
  const profile = await getBookerProfileForUser(userId);
  if (!profile) throw new Error("Create a booker profile before sending requests");

  const artistSlug = readString(formData, "artistSlug");
  const artist = await getPublicArtistProfileBySlug(artistSlug);
  if (!artist) throw new Error("Artist is not available for public requests");

  const eventName = readString(formData, "eventName");
  const pitch = readString(formData, "pitch");
  if (!eventName) throw new Error("Event name is required");
  if (!pitch) throw new Error("Pitch is required");

  const requestedStatus = readString(formData, "status");
  const status = requestedStatus === "request_sent" ? "request_sent" : "draft";
  const bookerEventId = readNullable(formData, "bookerEventId");

  if (bookerEventId) {
    const [event] = await db
      .select({ id: bookerEvents.id })
      .from(bookerEvents)
      .where(
        and(eq(bookerEvents.id, bookerEventId), eq(bookerEvents.bookerProfileId, profile.id)),
      )
      .limit(1);
    if (!event) throw new Error("Selected event was not found");
  }

  const [request] = await db
    .insert(bookingRequests)
    .values({
      bookerProfileId: profile.id,
      artistId: artist.id,
      bookerEventId,
      status,
      eventName,
      eventType: readString(formData, "eventType") || "show",
      venueName: readNullable(formData, "venueName"),
      market: readNullable(formData, "market"),
      targetDate: readNullable(formData, "targetDate"),
      capacityBand: readNullable(formData, "capacityBand"),
      budgetBand: readNullable(formData, "budgetBand"),
      pitch,
    })
    .returning();

  await recordEvent({
    actorUserId: userId,
    principalType: "booker_profile",
    principalId: profile.id,
    role: "owner",
    action: status === "request_sent" ? "booking_request.sent" : "booking_request.drafted",
    correlationId: request.id,
    afterStatus: status,
    payload: { artistId: artist.id, eventName: request.eventName },
  });

  return request;
}

/**
 * The artist team responds to an inbound request. `accepted` is a deal-in-principle
 * (doc 05): it is NOT the money-backed `confirmed`, which arrives with the payments
 * increment (deposit captured, per doc 02 DepositCaptured -> Confirmed). Only the
 * team that manages the artist may respond, and only a `request_sent` request can move.
 */
export async function respondToBookingRequest(
  userId: string,
  requestId: string,
  decision: "accepted" | "declined",
): Promise<BookingRequest> {
  const [row] = await db
    .select({
      request: bookingRequests,
      ownerUserId: artistProfiles.ownerUserId,
      orgId: artistProfiles.orgId,
    })
    .from(bookingRequests)
    .innerJoin(artistProfiles, eq(bookingRequests.artistId, artistProfiles.id))
    .where(eq(bookingRequests.id, requestId))
    .limit(1);

  if (!row) throw new Error("Booking request not found");

  const canManage = await canManageArtist(userId, {
    ownerUserId: row.ownerUserId,
    orgId: row.orgId,
  });
  if (!canManage) throw new Error("Not authorized to respond to this request");

  if (row.request.status !== "request_sent") {
    throw new Error("Only a sent request can be accepted or declined");
  }

  const [updated] = await db
    .update(bookingRequests)
    .set({ status: decision, updatedAt: new Date() })
    .where(eq(bookingRequests.id, requestId))
    .returning();

  await recordEvent({
    actorUserId: userId,
    principalType: "artist_profile",
    principalId: updated.artistId,
    role: "team",
    action: decision === "accepted" ? "booking_request.accepted" : "booking_request.declined",
    correlationId: updated.id,
    beforeStatus: "request_sent",
    afterStatus: decision,
    payload: { eventName: updated.eventName, bookerProfileId: updated.bookerProfileId },
  });

  return updated;
}
