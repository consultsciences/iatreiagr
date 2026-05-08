import { pgTable, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const listingCountsCacheTable = pgTable("listing_counts_cache", {
  id: integer("id").primaryKey(),
  counts: jsonb("counts").notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ListingCountsCache = typeof listingCountsCacheTable.$inferSelect;
