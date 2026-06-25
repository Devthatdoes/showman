import { pgTable, uuid, varchar, text, jsonb, timestamp } from "drizzle-orm/pg-core";

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
  genres: jsonb("genres").$type<string[]>().notNull().default([]),
  homeMarket: varchar("home_market", { length: 120 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ArtistProfile = typeof artistProfiles.$inferSelect;
export type NewArtistProfile = typeof artistProfiles.$inferInsert;
