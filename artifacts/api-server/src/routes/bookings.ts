import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { bookingsTable } from "@workspace/db";
import { eq, and, desc, isNull } from "drizzle-orm";
import { CreateBookingBody } from "@workspace/api-zod";
import type { PatientBooking } from "@workspace/types";

const router = Router();

// GET /api/bookings — user's own bookings
router.get("/bookings", async (req, res) => {
  const { userId, sessionClaims } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  // Claim any guest bookings made with the same email
  const userEmail = typeof sessionClaims?.email === "string" ? sessionClaims.email : undefined;
  if (userEmail) {
    await db
      .update(bookingsTable)
      .set({ user_id: userId })
      .where(
        and(
          isNull(bookingsTable.user_id),
          eq(bookingsTable.patient_email, userEmail),
        ),
      );
  }

  const rows = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.user_id, userId))
    .orderBy(desc(bookingsTable.appointment_date), desc(bookingsTable.appointment_slot));

  res.json(rows satisfies PatientBooking[]);
});

// POST /api/bookings — create a booking (public, user_id always from auth)
router.post("/bookings", async (req, res) => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues }); return;
  }
  const { userId } = getAuth(req);

  const [row] = await db
    .insert(bookingsTable)
    .values({
      ...parsed.data,
      user_id: userId ?? null,
      price: String(parsed.data.price),
    })
    .returning();

  res.status(201).json(row satisfies PatientBooking);
});

// POST /api/bookings/:id/cancel
router.post("/bookings/:id/cancel", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { id } = req.params;
  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, id))
    .limit(1);

  if (!booking) { res.status(404).json({ error: "Not found" }); return; }
  if (booking.user_id !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const [updated] = await db
    .update(bookingsTable)
    .set({ status: "cancelled", cancelled_at: new Date() })
    .where(eq(bookingsTable.id, id))
    .returning();

  res.json(updated satisfies PatientBooking);
});

export default router;
