import type { BookerEvent, BookerProfile, BookingRequest } from "@/db/schema";

export type RequestStatusBucket = {
  draft: number;
  request_sent: number;
  accepted: number;
  declined: number;
  cancelled: number;
};

export type BookerRequestListItem = BookingRequest & {
  artistSlug: string;
  artistStageName: string;
  artistImageUrl: string | null;
};

export type InboundRequestListItem = BookingRequest & {
  artistSlug: string;
  artistStageName: string;
  bookerDisplayName: string;
  bookerRoleTitle: string | null;
  bookerHomeMarket: string | null;
};

export type BookerDashboardData = {
  profile: BookerProfile;
  events: BookerEvent[];
  requests: BookerRequestListItem[];
  statusCounts: RequestStatusBucket;
};

export function emptyStatusCounts(): RequestStatusBucket {
  return { draft: 0, request_sent: 0, accepted: 0, declined: 0, cancelled: 0 };
}
