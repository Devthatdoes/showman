CREATE TYPE "public"."booker_profile_type" AS ENUM('individual', 'org_backed');--> statement-breakpoint
CREATE TYPE "public"."booking_request_status" AS ENUM('draft', 'request_sent', 'declined', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('owner', 'agent', 'finance', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('invited', 'active', 'suspended', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."org_type" AS ENUM('management', 'agency', 'label', 'festival', 'venue', 'promoter', 'personal');--> statement-breakpoint
CREATE TABLE "booker_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booker_profile_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"event_type" varchar(80) DEFAULT 'show' NOT NULL,
	"venue_name" varchar(160),
	"market" varchar(120),
	"target_date" date,
	"capacity_band" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booker_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"display_name" varchar(160) NOT NULL,
	"type" "booker_profile_type" DEFAULT 'individual' NOT NULL,
	"owner_user_id" text NOT NULL,
	"org_id" uuid,
	"role_title" varchar(120),
	"home_market" varchar(120),
	"short_descriptor" varchar(180),
	"credibility_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booker_profiles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "booking_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booker_profile_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	"booker_event_id" uuid,
	"status" "booking_request_status" DEFAULT 'draft' NOT NULL,
	"event_name" varchar(180) NOT NULL,
	"event_type" varchar(80) DEFAULT 'show' NOT NULL,
	"venue_name" varchar(160),
	"market" varchar(120),
	"target_date" date,
	"capacity_band" varchar(80),
	"budget_band" varchar(80),
	"pitch" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"correlation_id" uuid,
	"actor_user_id" text,
	"principal_type" varchar(40) NOT NULL,
	"principal_id" text NOT NULL,
	"role" varchar(40),
	"action" varchar(120) NOT NULL,
	"before_status" varchar(80),
	"after_status" varchar(80),
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"org_id" uuid NOT NULL,
	"role" "membership_role" DEFAULT 'owner' NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"invited_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orgs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(160) NOT NULL,
	"type" "org_type" DEFAULT 'personal' NOT NULL,
	"owner_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orgs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "artist_profiles" ADD COLUMN "org_id" uuid;--> statement-breakpoint
ALTER TABLE "booker_events" ADD CONSTRAINT "booker_events_booker_profile_id_booker_profiles_id_fk" FOREIGN KEY ("booker_profile_id") REFERENCES "public"."booker_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booker_profiles" ADD CONSTRAINT "booker_profiles_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booker_profiles" ADD CONSTRAINT "booker_profiles_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_booker_profile_id_booker_profiles_id_fk" FOREIGN KEY ("booker_profile_id") REFERENCES "public"."booker_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_artist_id_artist_profiles_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artist_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_booker_event_id_booker_events_id_fk" FOREIGN KEY ("booker_event_id") REFERENCES "public"."booker_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orgs" ADD CONSTRAINT "orgs_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booker_events_profile_idx" ON "booker_events" USING btree ("booker_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "booker_profiles_owner_user_unique" ON "booker_profiles" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "booking_requests_booker_idx" ON "booking_requests" USING btree ("booker_profile_id");--> statement-breakpoint
CREATE INDEX "booking_requests_artist_idx" ON "booking_requests" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "booking_requests_status_idx" ON "booking_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_correlation_idx" ON "events" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "events_principal_idx" ON "events" USING btree ("principal_type","principal_id");--> statement-breakpoint
CREATE INDEX "events_actor_idx" ON "events" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "memberships_org_idx" ON "memberships" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_user_org_unique" ON "memberships" USING btree ("user_id","org_id");--> statement-breakpoint
CREATE INDEX "orgs_owner_user_idx" ON "orgs" USING btree ("owner_user_id");--> statement-breakpoint
ALTER TABLE "artist_profiles" ADD CONSTRAINT "artist_profiles_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE set null ON UPDATE no action;
