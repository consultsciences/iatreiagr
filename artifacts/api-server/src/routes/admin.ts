import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { doctorProfilesTable, clinicClaimsTable, clinicClaimAuditLogTable, userRolesTable, listingsTable } from "@workspace/db";
import { eq, and, desc, ilike, or, sql, gte, lte, like, SQL } from "drizzle-orm";
import { AdminUpdateDoctorBody, AdminUpdateClaimBody, AdminCreateAuditLogBody, AdminUpdateListingStatusBody } from "@workspace/api-zod";
import type { DoctorProfile, ClinicClaim, ClinicClaimAuditLog } from "@workspace/db";
import { invalidateCountsCache } from "./listings";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

// GET /api/admin/roles/check
router.get("/admin/roles/check", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [adminRow] = await db
    .select()
    .from(userRolesTable)
    .where(and(eq(userRolesTable.user_id, userId), eq(userRolesTable.role, "admin")))
    .limit(1);
  res.json({ is_admin: !!adminRow });
});

// GET /api/admin/doctors
router.get("/admin/doctors", requireAdmin, async (req, res) => {
  const { verified, search, limit = "20", offset = "0" } = req.query as Record<string, string>;
  const lim = Math.min(parseInt(limit) || 20, 200);
  const off = parseInt(offset) || 0;

  const conditions: SQL[] = [];
  if (verified === "true") conditions.push(eq(doctorProfilesTable.verified, true));
  else if (verified === "false") conditions.push(eq(doctorProfilesTable.verified, false));
  if (search) {
    const clause = or(
      ilike(doctorProfilesTable.full_name, `%${search}%`),
      ilike(doctorProfilesTable.email!, `%${search}%`),
      ilike(doctorProfilesTable.specialty!, `%${search}%`),
      ilike(doctorProfilesTable.city!, `%${search}%`),
    );
    if (clause) conditions.push(clause);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db.select().from(doctorProfilesTable).where(where).orderBy(desc(doctorProfilesTable.created_at)).limit(lim).offset(off),
    db.select({ count: sql<number>`count(*)` }).from(doctorProfilesTable).where(where),
  ]);

  res.json({ doctors: rows, total: Number(countResult[0]?.count ?? 0) });
});

// PATCH /api/admin/doctors/:id
router.patch("/admin/doctors/:id", requireAdmin, async (req, res) => {
  const parsed = AdminUpdateDoctorBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  const patch: Partial<DoctorProfile> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) (patch as Record<string, unknown>)[k] = v;
  }

  const [row] = await db
    .update(doctorProfilesTable)
    .set(patch)
    .where(eq(doctorProfilesTable.id, req.params.id))
    .returning();

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// GET /api/admin/claims
router.get("/admin/claims", requireAdmin, async (req, res) => {
  const { status = "pending" } = req.query as Record<string, string>;
  const conditions: SQL[] = [];
  if (status !== "all") conditions.push(eq(clinicClaimsTable.status, status));

  const rows = await db
    .select()
    .from(clinicClaimsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(clinicClaimsTable.created_at));

  res.json(rows);
});

// PATCH /api/admin/claims/:id
router.patch("/admin/claims/:id", requireAdmin, async (req, res) => {
  const parsed = AdminUpdateClaimBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  const [row] = await db
    .update(clinicClaimsTable)
    .set({ status: parsed.data.status, decision_note: parsed.data.decision_note ?? null })
    .where(and(eq(clinicClaimsTable.id, req.params.id), eq(clinicClaimsTable.status, "pending")))
    .returning();

  if (!row) { res.status(404).json({ error: "Not found or not pending" }); return; }
  res.json(row);
});

// GET /api/admin/audit-log
router.get("/admin/audit-log", requireAdmin, async (req, res) => {
  const q = req.query as Record<string, string>;
  const lim = Math.min(parseInt(q.limit || "500"), 5000);

  const conditions: SQL[] = [];
  if (q.from_iso) conditions.push(gte(clinicClaimAuditLogTable.created_at!, new Date(q.from_iso)));
  if (q.to_iso) conditions.push(lte(clinicClaimAuditLogTable.created_at!, new Date(q.to_iso)));
  if (q.claim_id) conditions.push(eq(clinicClaimAuditLogTable.claim_id, q.claim_id));
  if (q.failures_only === "true") conditions.push(like(clinicClaimAuditLogTable.decision!, "failed_%"));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db
    .select()
    .from(clinicClaimAuditLogTable)
    .where(where)
    .orderBy(desc(clinicClaimAuditLogTable.created_at))
    .limit(lim);

  res.json(rows);
});

// POST /api/admin/audit-log
router.post("/admin/audit-log", requireAdmin, async (req, res) => {
  const { userId } = getAuth(req);

  const parsed = AdminCreateAuditLogBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  await db.insert(clinicClaimAuditLogTable).values({
    ...parsed.data,
    admin_id: userId!,
  });

  res.status(201).end();
});

// PATCH /api/admin/listings/:id — update listing status; invalidates counts cache when publishing
router.patch("/admin/listings/:id", requireAdmin, async (req, res) => {
  const parsed = AdminUpdateListingStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  const [row] = await db
    .update(listingsTable)
    .set({ status: parsed.data.status })
    .where(eq(listingsTable.id, req.params.id))
    .returning();

  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  invalidateCountsCache("PATCH /api/admin/listings/:id");

  res.json(row);
});

export default router;
