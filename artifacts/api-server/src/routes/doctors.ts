import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { doctorProfilesTable, doctorAvailabilityTable, bookingsTable, clinicClaimsTable } from "@workspace/db";
import { eq, and, desc, asc, or, ilike, sql } from "drizzle-orm";
import { UpsertMyDoctorProfileBody, AddAvailabilitySlotBody, CreateClinicClaimBody } from "@workspace/api-zod";

const router = Router();

// GET /api/doctors — public list of published doctors
router.get("/doctors", async (req, res) => {
  const { specialty, city, search, verified, limit = "50", offset = "0" } = req.query as Record<string, string>;
  const lim = Math.min(parseInt(limit) || 50, 200);
  const off = parseInt(offset) || 0;

  const conditions = [eq(doctorProfilesTable.is_published, true)];
  if (specialty) conditions.push(ilike(doctorProfilesTable.specialty!, `%${specialty}%`));
  if (city) conditions.push(ilike(doctorProfilesTable.city!, `%${city}%`));
  if (verified === "true") conditions.push(eq(doctorProfilesTable.verified, true));
  if (search) {
    conditions.push(
      or(
        ilike(doctorProfilesTable.full_name, `%${search}%`),
        ilike(doctorProfilesTable.specialty!, `%${search}%`),
        ilike(doctorProfilesTable.city!, `%${search}%`),
      )!,
    );
  }

  const [rows, countResult] = await Promise.all([
    db.select().from(doctorProfilesTable).where(and(...conditions)).orderBy(desc(doctorProfilesTable.created_at)).limit(lim).offset(off),
    db.select({ count: sql<number>`count(*)` }).from(doctorProfilesTable).where(and(...conditions)),
  ]);

  res.json({ doctors: rows, total: Number(countResult[0]?.count ?? 0) });
});

// GET /api/doctors/me — authenticated doctor's own profile
router.get("/doctors/me", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [row] = await db
    .select()
    .from(doctorProfilesTable)
    .where(eq(doctorProfilesTable.user_id, userId))
    .limit(1);

  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

// PUT /api/doctors/me — upsert doctor's own profile
router.put("/doctors/me", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = UpsertMyDoctorProfileBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

  const [row] = await db
    .insert(doctorProfilesTable)
    .values({ ...parsed.data, user_id: userId })
    .onConflictDoUpdate({
      target: doctorProfilesTable.user_id,
      set: parsed.data,
    })
    .returning();

  res.json(row);
});

// GET /api/doctors/me/availability
router.get("/doctors/me/availability", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const rows = await db
    .select()
    .from(doctorAvailabilityTable)
    .where(eq(doctorAvailabilityTable.user_id, userId))
    .orderBy(asc(doctorAvailabilityTable.day_of_week));

  res.json(rows);
});

// POST /api/doctors/me/availability
router.post("/doctors/me/availability", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = AddAvailabilitySlotBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

  const [row] = await db
    .insert(doctorAvailabilityTable)
    .values({ ...parsed.data, user_id: userId })
    .returning();

  res.status(201).json(row);
});

// DELETE /api/doctors/me/availability/:id
router.delete("/doctors/me/availability/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [deleted] = await db
    .delete(doctorAvailabilityTable)
    .where(and(eq(doctorAvailabilityTable.id, req.params.id), eq(doctorAvailabilityTable.user_id, userId)))
    .returning();

  if (!deleted) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

// GET /api/doctors/:id/availability — public
router.get("/doctors/:id/availability", async (req, res) => {
  const rows = await db
    .select()
    .from(doctorAvailabilityTable)
    .where(eq(doctorAvailabilityTable.user_id, req.params.id))
    .orderBy(asc(doctorAvailabilityTable.day_of_week));
  res.json(rows);
});

// GET /api/doctors/me/bookings — doctor's own bookings
router.get("/doctors/me/bookings", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const rows = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.doctor_id, userId))
    .orderBy(desc(bookingsTable.appointment_date));

  res.json(rows);
});

// GET /api/doctors/me/claims
router.get("/doctors/me/claims", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const rows = await db
    .select()
    .from(clinicClaimsTable)
    .where(eq(clinicClaimsTable.user_id, userId));

  res.json(rows);
});

// POST /api/doctors/me/claims
router.post("/doctors/me/claims", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = CreateClinicClaimBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

  const [row] = await db
    .insert(clinicClaimsTable)
    .values({ ...parsed.data, user_id: userId })
    .returning();

  res.status(201).json(row);
});

// DELETE /api/doctors/me/claims/:id
router.delete("/doctors/me/claims/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [deleted] = await db
    .delete(clinicClaimsTable)
    .where(and(eq(clinicClaimsTable.id, req.params.id), eq(clinicClaimsTable.user_id, userId)))
    .returning();

  if (!deleted) return res.status(403).json({ error: "Forbidden or not found" });
  res.status(204).end();
});

// GET /api/doctors/:id — public doctor profile by ID
router.get("/doctors/:id", async (req, res) => {
  const [row] = await db
    .select()
    .from(doctorProfilesTable)
    .where(eq(doctorProfilesTable.id, req.params.id))
    .limit(1);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

export default router;
