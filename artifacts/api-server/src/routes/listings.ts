import { Router } from "express";
import { db } from "@workspace/db";
import { listingsTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";

const router = Router();

const KNOWN_CATEGORIES = ["spaces", "equipment", "jobs", "supplies", "services"] as const;

router.get("/listings/counts", async (req, res) => {
  const rows = await db
    .select({ category: listingsTable.category, count: count() })
    .from(listingsTable)
    .where(eq(listingsTable.status, "published"))
    .groupBy(listingsTable.category);

  const counts: Record<string, number> = Object.fromEntries(
    KNOWN_CATEGORIES.map((c) => [c, 0])
  );
  let total = 0;
  for (const row of rows) {
    counts[row.category] = Number(row.count);
    total += Number(row.count);
  }
  res.json({ ...counts, total });
});

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
    .where(and(eq(listingsTable.slug, slug), eq(listingsTable.status, "published")))
    .limit(1);
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
