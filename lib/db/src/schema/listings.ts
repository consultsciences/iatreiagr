import { pgTable, text, boolean, numeric, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const listingsTable = pgTable("listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  city: text("city"),
  region: text("region"),
  price: numeric("price", { precision: 10, scale: 2 }),
  price_unit: text("price_unit"),
  price_label: text("price_label"),
  badge: text("badge"),
  meta: text("meta"),
  image_url: text("image_url"),
  contact_name: text("contact_name"),
  contact_email: text("contact_email"),
  contact_phone: text("contact_phone"),
  featured: boolean("featured").notNull().default(false),
  status: text("status").notNull().default("published"),
  user_id: text("user_id"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({ id: true, created_at: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;
