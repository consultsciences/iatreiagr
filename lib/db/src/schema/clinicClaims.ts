import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clinicClaimsTable = pgTable("clinic_claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinic_id: text("clinic_id").notNull(),
  user_id: text("user_id").notNull(),
  status: text("status").notNull().default("pending"),
  decision_note: text("decision_note"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const clinicClaimAuditLogTable = pgTable("clinic_claim_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  claim_id: uuid("claim_id").notNull(),
  admin_id: text("admin_id").notNull(),
  decision: text("decision").notNull(),
  note: text("note"),
  error_detail: text("error_detail"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertClinicClaimSchema = createInsertSchema(clinicClaimsTable).omit({ id: true, created_at: true });
export type InsertClinicClaim = z.infer<typeof insertClinicClaimSchema>;
export type ClinicClaim = typeof clinicClaimsTable.$inferSelect;

export const insertClinicClaimAuditLogSchema = createInsertSchema(clinicClaimAuditLogTable).omit({ id: true, created_at: true });
export type InsertClinicClaimAuditLog = z.infer<typeof insertClinicClaimAuditLogSchema>;
export type ClinicClaimAuditLog = typeof clinicClaimAuditLogTable.$inferSelect;
