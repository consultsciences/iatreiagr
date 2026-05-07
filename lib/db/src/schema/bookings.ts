import { pgTable, text, uuid, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingsTable = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id"),
  confirmation_code: text("confirmation_code").notNull(),
  doctor_id: text("doctor_id").notNull(),
  doctor_name: text("doctor_name").notNull(),
  doctor_specialty: text("doctor_specialty").notNull(),
  doctor_address: text("doctor_address"),
  appointment_date: text("appointment_date").notNull(),
  appointment_slot: text("appointment_slot").notNull(),
  visit_type: text("visit_type").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  patient_name: text("patient_name").notNull(),
  patient_email: text("patient_email").notNull(),
  patient_phone: text("patient_phone").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("active"),
  cancelled_at: timestamp("cancelled_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, created_at: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
