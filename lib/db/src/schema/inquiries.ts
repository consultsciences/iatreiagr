import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inquiriesTable = pgTable("inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  listing_id: uuid("listing_id").notNull(),
  sender_name: text("sender_name").notNull(),
  sender_email: text("sender_email").notNull(),
  sender_phone: text("sender_phone"),
  message: text("message").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertInquirySchema = createInsertSchema(inquiriesTable).omit({ id: true, created_at: true });
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Inquiry = typeof inquiriesTable.$inferSelect;
