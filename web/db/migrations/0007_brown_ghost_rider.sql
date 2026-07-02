ALTER TYPE "public"."booking_request_status" ADD VALUE 'accepted' BEFORE 'declined';--> statement-breakpoint
ALTER TABLE "booker_profiles" DROP CONSTRAINT "booker_profiles_owner_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_requests" DROP CONSTRAINT "booking_requests_artist_id_artist_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "booker_profiles" ADD CONSTRAINT "booker_profiles_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_artist_id_artist_profiles_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artist_profiles"("id") ON DELETE restrict ON UPDATE no action;