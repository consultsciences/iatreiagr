import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { doctorProfilesTable, clinicClaimsTable, clinicClaimAuditLogTable, userRolesTable, listingsTable } from "@workspace/db";
import { eq, and, desc, ilike, or, sql, gte, lte, like, SQL, ne, count } from "drizzle-orm";
import { AdminUpdateDoctorBody, AdminUpdateClaimBody, AdminCreateAuditLogBody, AdminUpdateListingStatusBody } from "@workspace/api-zod";
import type { DoctorProfile as DbDoctorProfile } from "@workspace/db";
import type { DoctorProfile, ClinicClaim, AuditLogEntry } from "@workspace/types";
import { userSubscriptionsTable } from "@workspace/db";
import { invalidateCountsCache } from "./listings";
import { requireAdmin } from "../middlewares/requireAdmin";
import { notifySellerOfListingStatusChange } from "../lib/listingEmail";
import { logger } from "../lib/logger";

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

  // Drizzle Date fields are a structural subtype of Date|string defined in @workspace/types
  res.json({ doctors: rows satisfies DoctorProfile[], total: Number(countResult[0]?.count ?? 0) });
});

// PATCH /api/admin/doctors/:id
router.patch("/admin/doctors/:id", requireAdmin, async (req, res) => {
  const parsed = AdminUpdateDoctorBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  const patch: Partial<DbDoctorProfile> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) (patch as Record<string, unknown>)[k] = v;
  }

  const doctorId = req.params.id as string;
  const [row] = await db
    .update(doctorProfilesTable)
    .set(patch)
    .where(eq(doctorProfilesTable.id, doctorId))
    .returning();

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row satisfies DoctorProfile);
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

  res.json(rows satisfies ClinicClaim[]);
});

// PATCH /api/admin/claims/:id
router.patch("/admin/claims/:id", requireAdmin, async (req, res) => {
  const parsed = AdminUpdateClaimBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  const claimId = req.params.id as string;
  const [row] = await db
    .update(clinicClaimsTable)
    .set({ status: parsed.data.status, decision_note: parsed.data.decision_note ?? null })
    .where(and(eq(clinicClaimsTable.id, claimId), eq(clinicClaimsTable.status, "pending")))
    .returning();

  if (!row) { res.status(404).json({ error: "Not found or not pending" }); return; }
  res.json(row satisfies ClinicClaim);
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

  res.json(rows satisfies AuditLogEntry[]);
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

// GET /api/admin/listings — list listings by status (default: pending), optionally filtered by search/category
router.get("/admin/listings", requireAdmin, async (req, res) => {
  const { status = "pending", search, category, limit = "20", offset = "0" } = req.query as Record<string, string>;
  const lim = Math.min(parseInt(limit) || 20, 200);
  const off = parseInt(offset) || 0;

  const conditions: SQL[] = [eq(listingsTable.status, status)];
  if (category) conditions.push(eq(listingsTable.category, category));
  if (search) {
    const clause = ilike(listingsTable.title, `%${search}%`);
    conditions.push(clause);
  }

  const where = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db.select().from(listingsTable).where(where).orderBy(desc(listingsTable.created_at)).limit(lim).offset(off),
    db.select({ count: sql<number>`count(*)` }).from(listingsTable).where(where),
  ]);

  res.json({ listings: rows, total: Number(countResult[0]?.count ?? 0) });
});

// PATCH /api/admin/listings/:id — update listing status; invalidates counts cache when publishing
router.patch("/admin/listings/:id", requireAdmin, async (req, res) => {
  const parsed = AdminUpdateListingStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  const listingId = req.params.id as string;
  const [existing] = await db
    .select({ status: listingsTable.status })
    .from(listingsTable)
    .where(eq(listingsTable.id, listingId))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const previousStatus = existing.status;
  const newStatus = parsed.data.status;

  const [row] = await db
    .update(listingsTable)
    .set({ status: newStatus })
    .where(eq(listingsTable.id, listingId))
    .returning();

  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  const affectsPublishedCount =
    newStatus === "published" ||
    (previousStatus === "published" && newStatus !== "published");
  if (affectsPublishedCount) {
    invalidateCountsCache("PATCH /api/admin/listings/:id");
  }

  const isStatusTransition = newStatus !== previousStatus;
  const isNotifiableStatus = newStatus === "published" || newStatus === "archived";
  if (row.user_id && isStatusTransition && isNotifiableStatus) {
    notifySellerOfListingStatusChange(row.user_id, row.title, row.status).catch((err) => {
      logger.error({ err, listingId: row.id, userId: row.user_id, status: row.status }, "admin: unexpected error in listing email notification");
    });
  }

  res.json(row);
});

// GET /api/admin/stats — aggregate counts across listings, users, doctors, claims
router.get("/admin/stats", requireAdmin, async (req, res) => {
  const [listingStats, totalUsers, totalDoctors, pendingClaims] = await Promise.all([
    db.select({ status: listingsTable.status, n: count() }).from(listingsTable).groupBy(listingsTable.status),
    db.select({ n: count() }).from(userSubscriptionsTable),
    db.select({ n: count() }).from(doctorProfilesTable),
    db.select({ n: count() }).from(clinicClaimsTable).where(eq(clinicClaimsTable.status, "pending")),
  ]);
  const byStatus: Record<string, number> = {};
  for (const row of listingStats) byStatus[row.status] = Number(row.n);

  res.json({
    listings: {
      total: Object.values(byStatus).reduce((a, b) => a + b, 0),
      published: byStatus["published"] ?? 0,
      pending: byStatus["pending"] ?? 0,
      archived: byStatus["archived"] ?? 0,
    },
    users: Number(totalUsers[0]?.n ?? 0),
    doctors: Number(totalDoctors[0]?.n ?? 0),
    pendingClaims: Number(pendingClaims[0]?.n ?? 0),
  });
});

// GET /api/admin/users — list users with their plans and active listing counts
router.get("/admin/users", requireAdmin, async (req, res) => {
  const { limit = "50", offset = "0" } = req.query as Record<string, string>;
  const lim = Math.min(parseInt(limit) || 50, 200);
  const off = parseInt(offset) || 0;

  const [rows, countResult, listingCounts, adminRows] = await Promise.all([
    db.select().from(userSubscriptionsTable).orderBy(desc(userSubscriptionsTable.created_at)).limit(lim).offset(off),
    db.select({ n: count() }).from(userSubscriptionsTable),
    db.select({ user_id: listingsTable.user_id, n: count() })
      .from(listingsTable)
      .where(ne(listingsTable.status, "archived"))
      .groupBy(listingsTable.user_id),
    db.select({ user_id: userRolesTable.user_id }).from(userRolesTable).where(eq(userRolesTable.role, "admin")),
  ]);

  const countMap: Record<string, number> = {};
  for (const r of listingCounts) if (r.user_id) countMap[r.user_id] = Number(r.n);
  const adminSet = new Set(adminRows.map((r) => r.user_id));

  res.json({
    users: rows.map((r) => ({ ...r, activeListings: countMap[r.user_id] ?? 0, is_admin: adminSet.has(r.user_id) })),
    total: Number(countResult[0]?.n ?? 0),
  });
});

// POST /api/admin/roles — grant a role (default: admin) to a user
router.post("/admin/roles", requireAdmin, async (req, res) => {
  const { user_id, role = "admin" } = req.body as { user_id?: string; role?: string };
  if (!user_id) { res.status(400).json({ error: "user_id required" }); return; }
  await db.insert(userRolesTable).values({ user_id, role }).onConflictDoNothing();
  res.status(201).json({ user_id, role });
});

// DELETE /api/admin/roles/:userId — revoke admin role
router.delete("/admin/roles/:userId", requireAdmin, async (req, res) => {
  const { userId: currentUserId } = getAuth(req);
  const targetUserId = req.params.userId as string;
  if (targetUserId === currentUserId) { res.status(400).json({ error: "Cannot revoke your own admin role" }); return; }
  await db.delete(userRolesTable).where(and(eq(userRolesTable.user_id, targetUserId), eq(userRolesTable.role, "admin")));
  res.status(204).end();
});

export default router;
