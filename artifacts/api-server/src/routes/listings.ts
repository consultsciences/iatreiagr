import { Router } from "express";
import { db } from "@workspace/db";
import { listingsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

router.get("/listings", async (req, res) => {
  const { category, featured, limit = "50" } = req.query as Record<string, string>;
  const lim = Math.min(parseInt(limit) || 50, 200);

  const conditions = [eq(listingsTable.status, "published")];
  if (category) conditions.push(eq(listingsTable.category, category));
  if (featured === "true") conditions.push(eq(listingsTable.featured, true));

  const rows = await db
    .select()
    .from(listingsTable)
    .where(and(...conditions))
    .orderBy(desc(listingsTable.featured), desc(listingsTable.created_at))
    .limit(lim);

  res.json(rows);
});

router.get("/listings/:slug", async (req, res) => {
  const { slug } = req.params;
  const [row] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.slug, slug))
    .limit(1);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

export default router;
