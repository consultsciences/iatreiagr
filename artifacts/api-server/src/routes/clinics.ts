import { Router } from "express";
import { z } from "zod";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { clinicSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

const UpsertClinicSettingBody = z.object({
  tier: z.enum(["premium", "featured", "verified"]),
  tagline: z.string().max(200).optional(),
  badge_hidden: z.boolean().optional(),
});

router.get("/api/clinics/settings", async (_req, res) => {
  try {
    const rows = await db.select().from(clinicSettingsTable);
    res.json({ settings: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch clinic settings" });
  }
});

router.post("/api/admin/clinics/settings/:id", requireAdmin, async (req, res) => {
  const clinicId = Number(req.params.id);
  if (!Number.isFinite(clinicId) || clinicId <= 0) {
    res.status(400).json({ error: "Invalid clinic id" });
    return;
  }

  const parsed = UpsertClinicSettingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", issues: parsed.error.issues });
    return;
  }

  try {
    const [row] = await db
      .insert(clinicSettingsTable)
      .values({
        clinic_id: clinicId,
        tier: parsed.data.tier,
        tagline: parsed.data.tagline ?? null,
        badge_hidden: parsed.data.badge_hidden ?? false,
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: clinicSettingsTable.clinic_id,
        set: {
          tier: parsed.data.tier,
          tagline: parsed.data.tagline ?? null,
          badge_hidden: parsed.data.badge_hidden ?? false,
          updated_at: new Date(),
        },
      })
      .returning();
    res.json({ setting: row });
  } catch (err) {
    res.status(500).json({ error: "Failed to save clinic setting" });
  }
});

router.delete("/api/admin/clinics/settings/:id", requireAdmin, async (req, res) => {
  const clinicId = Number(req.params.id);
  if (!Number.isFinite(clinicId) || clinicId <= 0) {
    res.status(400).json({ error: "Invalid clinic id" });
    return;
  }
  try {
    await db
      .delete(clinicSettingsTable)
      .where(eq(clinicSettingsTable.clinic_id, clinicId));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete clinic setting" });
  }
});

router.post("/api/admin/listings/generate", requireAdmin, async (req, res) => {
  const { count = 5 } = req.body as { count?: number };
  try {
    const { generateListings } = await import("../lib/listingGenerator");
    const inserted = await generateListings(Math.min(count, 10));
    res.json({ generated: inserted.length, listings: inserted });
  } catch (err) {
    res.status(500).json({ error: "Generation failed" });
  }
});

export default router;
