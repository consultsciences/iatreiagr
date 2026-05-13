import { pgTable, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const clinicSettingsTable = pgTable("clinic_settings", {
  clinic_id: integer("clinic_id").primaryKey(),
  tier: text("tier").notNull(),
  tagline: text("tagline"),
  badge_hidden: boolean("badge_hidden").notNull().default(false),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export type ClinicSetting = typeof clinicSettingsTable.$inferSelect;
