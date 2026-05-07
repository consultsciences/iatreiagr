import { pgTable, text, boolean, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const doctorProfilesTable = pgTable("doctor_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id").notNull().unique(),
  full_name: text("full_name").notNull(),
  specialty: text("specialty"),
  city: text("city"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  bio: text("bio"),
  photo_url: text("photo_url"),
  clinic_id: text("clinic_id"),
  subscription_tier: text("subscription_tier").notNull().default("free"),
  is_published: boolean("is_published").notNull().default(true),
  verified: boolean("verified").notNull().default(false),
  verified_at: timestamp("verified_at"),
  onboarding_completed_at: timestamp("onboarding_completed_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertDoctorProfileSchema = createInsertSchema(doctorProfilesTable).omit({ id: true, created_at: true });
export type InsertDoctorProfile = z.infer<typeof insertDoctorProfileSchema>;
export type DoctorProfile = typeof doctorProfilesTable.$inferSelect;
