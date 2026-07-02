ALTER TABLE "artist_profiles" ADD COLUMN IF NOT EXISTS "image_url" text;--> statement-breakpoint
ALTER TABLE "artist_profiles" ADD COLUMN IF NOT EXISTS "primary_genre" varchar(80);
