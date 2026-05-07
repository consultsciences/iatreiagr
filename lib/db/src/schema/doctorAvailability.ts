import { pgTable, text, integer, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const doctorAvailabilityTable = pgTable("doctor_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id").notNull(),
  day_of_week: integer("day_of_week").notNull(),
  start_time: text("start_time").notNull(),
  end_time: text("end_time").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertDoctorAvailabilitySchema = createInsertSchema(doctorAvailabilityTable).omit({ id: true, created_at: true });
export type InsertDoctorAvailability = z.infer<typeof insertDoctorAvailabilitySchema>;
export type DoctorAvailability = typeof doctorAvailabilityTable.$inferSelect;
