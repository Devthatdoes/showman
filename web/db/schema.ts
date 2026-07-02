import { pgTable, uuid, varchar, text, jsonb, timestamp, date, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const orgType = pgEnum("org_type", [
  "management",
  "agency",
  "label",
  "festival",
  "venue",
  "promoter",
  "personal",
]);

export const membershipRole = pgEnum("membership_role", ["owner", "agent", "finance", "viewer"]);
export const membershipStatus = pgEnum("membership_status", ["invited", "active", "suspended", "revoked"]);

export const bookerProfileType = pgEnum("booker_profile_type", ["individual", "org_backed"]);
export const bookingRequestStatus = pgEnum("booking_request_status", [
  "draft",
  "request_sent",
  "accepted",
  "declined",
  "cancelled",
]);

export const orgs = pgTable(
  "orgs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 160 }).notNull(),
    type: orgType("type").notNull().default("personal"),
    ownerUserId: text("owner_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("orgs_owner_user_idx").on(t.ownerUserId)],
);

export type Org = typeof orgs.$inferSelect;
export type NewOrg = typeof orgs.$inferInsert;

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    role: membershipRole("role").notNull().default("owner"),
    status: membershipStatus("status").notNull().default("active"),
    invitedByUserId: text("invited_by_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("memberships_user_idx").on(t.userId),
    index("memberships_org_idx").on(t.orgId),
    uniqueIndex("memberships_user_org_unique").on(t.userId, t.orgId),
  ],
);

export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;

/**
 * ArtistProfile — the supply-side principal (the bookable act). See docs/foundation/02-domain-model.md §1.2.
 * Phase 0 slice: the verified EPK as a standalone, single-player profile.
 * Deliberately omitted for now (decisive points implemented when the build reaches them):
 *   - fee / private_floor  -> verified-booker-gated visibility (docs 02/08)
 *   - verification provenance / authority (OAuth-constellation)  -> doc 03
 *   - Org / Membership ownership (on-behalf-of)  -> doc 07
 */
export const artistProfiles = pgTable("artist_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  stageName: varchar("stage_name", { length: 120 }).notNull(),
  bio: text("bio"),
  imageUrl: text("image_url"),
  primaryGenre: varchar("primary_genre", { length: 80 }),
  genres: jsonb("genres").$type<string[]>().notNull().default([]),
  homeMarket: varchar("home_market", { length: 120 }),
  orgId: uuid("org_id").references(() => orgs.id, { onDelete: "set null" }),
  // User-level ownership (Better Auth user). Org/Membership ownership comes later (doc 07).
  // Nullable so pre-auth seed rows survive; set null on user deletion so profiles are never destroyed.
  ownerUserId: text("owner_user_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ArtistProfile = typeof artistProfiles.$inferSelect;
export type NewArtistProfile = typeof artistProfiles.$inferInsert;

export const bookerProfiles = pgTable(
  "booker_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    type: bookerProfileType("type").notNull().default("individual"),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    orgId: uuid("org_id").references(() => orgs.id, { onDelete: "set null" }),
    roleTitle: varchar("role_title", { length: 120 }),
    homeMarket: varchar("home_market", { length: 120 }),
    shortDescriptor: varchar("short_descriptor", { length: 180 }),
    credibilitySummary: text("credibility_summary"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("booker_profiles_owner_user_unique").on(t.ownerUserId)],
);

export type BookerProfile = typeof bookerProfiles.$inferSelect;
export type NewBookerProfile = typeof bookerProfiles.$inferInsert;

export const bookerEvents = pgTable(
  "booker_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookerProfileId: uuid("booker_profile_id")
      .notNull()
      .references(() => bookerProfiles.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 180 }).notNull(),
    eventType: varchar("event_type", { length: 80 }).notNull().default("show"),
    venueName: varchar("venue_name", { length: 160 }),
    market: varchar("market", { length: 120 }),
    targetDate: date("target_date"),
    capacityBand: varchar("capacity_band", { length: 80 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("booker_events_profile_idx").on(t.bookerProfileId)],
);

export type BookerEvent = typeof bookerEvents.$inferSelect;
export type NewBookerEvent = typeof bookerEvents.$inferInsert;

export const bookingRequests = pgTable(
  "booking_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookerProfileId: uuid("booker_profile_id")
      .notNull()
      .references(() => bookerProfiles.id, { onDelete: "cascade" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artistProfiles.id, { onDelete: "restrict" }),
    bookerEventId: uuid("booker_event_id").references(() => bookerEvents.id, { onDelete: "set null" }),
    status: bookingRequestStatus("status").notNull().default("draft"),
    eventName: varchar("event_name", { length: 180 }).notNull(),
    eventType: varchar("event_type", { length: 80 }).notNull().default("show"),
    venueName: varchar("venue_name", { length: 160 }),
    market: varchar("market", { length: 120 }),
    targetDate: date("target_date"),
    capacityBand: varchar("capacity_band", { length: 80 }),
    budgetBand: varchar("budget_band", { length: 80 }),
    pitch: text("pitch").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("booking_requests_booker_idx").on(t.bookerProfileId),
    index("booking_requests_artist_idx").on(t.artistId),
    index("booking_requests_status_idx").on(t.status),
  ],
);

export type BookingRequest = typeof bookingRequests.$inferSelect;
export type NewBookingRequest = typeof bookingRequests.$inferInsert;

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    correlationId: uuid("correlation_id"),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    principalType: varchar("principal_type", { length: 40 }).notNull(),
    principalId: text("principal_id").notNull(),
    role: varchar("role", { length: 40 }),
    action: varchar("action", { length: 120 }).notNull(),
    beforeStatus: varchar("before_status", { length: 80 }),
    afterStatus: varchar("after_status", { length: 80 }),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("events_correlation_idx").on(t.correlationId),
    index("events_principal_idx").on(t.principalType, t.principalId),
    index("events_actor_idx").on(t.actorUserId),
  ],
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

/**
 * AvailabilityWindow — a calendar span for an ArtistProfile. See docs/foundation/06-availability-confirmation.md.
 * Phase 0: manual painting only. `held` / `booked` are reserved for the booking flow (later increments);
 * this increment's UI only sets `open` / `blocked`.
 */
export const availabilityStatus = pgEnum("availability_status", ["open", "held", "blocked", "booked"]);

export const availabilityWindows = pgTable(
  "availability_windows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artistProfiles.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(), // inclusive (YYYY-MM-DD)
    endDate: date("end_date").notNull(), // inclusive (YYYY-MM-DD)
    status: availabilityStatus("status").notNull().default("open"),
    market: varchar("market", { length: 120 }),
    note: text("note"),
    source: varchar("source", { length: 24 }).notNull().default("manual"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("availability_windows_artist_idx").on(t.artistId)],
);

export type AvailabilityWindow = typeof availabilityWindows.$inferSelect;
export type NewAvailabilityWindow = typeof availabilityWindows.$inferInsert;
