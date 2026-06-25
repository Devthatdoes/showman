CREATE TABLE "artist_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"stage_name" varchar(120) NOT NULL,
	"bio" text,
	"genres" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"home_market" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artist_profiles_slug_unique" UNIQUE("slug")
);
