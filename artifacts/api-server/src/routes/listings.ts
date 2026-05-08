import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { listingsTable, listingCountsCacheTable } from "@workspace/db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { CreateListingBody, UpdateListingBody } from "@workspace/api-zod";

const router = Router();

const KNOWN_CATEGORIES = ["spaces", "equipment", "jobs", "supplies", "services"] as const;

const COUNTS_CACHE_TTL_MS = 60_000;
const IN_PROCESS_TTL_MS = 10_000;
const CACHE_ROW_ID = 1;

interface InProcessCache {
  data: Record<string, number>;
  expiresAt: number;
}

let inProcessCache: InProcessCache | null = null;

async function fetchCountsFromDb(): Promise<Record<string, number>> {
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
  counts.total = total;
  return counts;
}

async function getCountsFromSharedCache(): Promise<Record<string, number> | null> {
  const [row] = await db
    .select()
    .from(listingCountsCacheTable)
    .where(eq(listingCountsCacheTable.id, CACHE_ROW_ID))
    .limit(1);

  if (!row) return null;

  const ageMs = Date.now() - new Date(row.updated_at).getTime();
  if (ageMs > COUNTS_CACHE_TTL_MS) return null;

  return row.counts as Record<string, number>;
}

async function writeCountsToSharedCache(counts: Record<string, number>): Promise<void> {
  await db
    .insert(listingCountsCacheTable)
    .values({ id: CACHE_ROW_ID, counts, updated_at: new Date() })
    .onConflictDoUpdate({
      target: listingCountsCacheTable.id,
      set: { counts, updated_at: new Date() },
    });
}

async function deleteSharedCache(): Promise<void> {
  await db
    .delete(listingCountsCacheTable)
    .where(eq(listingCountsCacheTable.id, CACHE_ROW_ID));
}

export function invalidateCountsCache(): void {
  inProcessCache = null;
  deleteSharedCache().catch((err) => {
    console.error("[counts-cache] failed to delete shared cache row:", err);
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);
}

async function generateUniqueSlug(base: string, attempts = 5): Promise<string> {
  const slug = slugify(base) || "listing";
  for (let i = 0; i < attempts; i++) {
    const suffix = Math.random().toString(36).substring(2, 8);
    const candidate = `${slug}-${suffix}`;
    const [existing] = await db
      .select({ id: listingsTable.id })
      .from(listingsTable)
      .where(eq(listingsTable.slug, candidate))
      .limit(1);
    if (!existing) return candidate;
  }
  return `${slug}-${Date.now()}`;
}

router.get("/listings/counts", async (req, res) => {
  const now = Date.now();

  if (inProcessCache && now < inProcessCache.expiresAt) {
    res.setHeader("Cache-Control", "public, max-age=60");
    res.setHeader("X-Cache", "HIT-PROCESS");
    res.json(inProcessCache.data);
    return;
  }

  const shared = await getCountsFromSharedCache();
  if (shared) {
    inProcessCache = { data: shared, expiresAt: now + IN_PROCESS_TTL_MS };
    res.setHeader("Cache-Control", "public, max-age=60");
    res.setHeader("X-Cache", "HIT-DB");
    res.json(shared);
    return;
  }

  const data = await fetchCountsFromDb();
  inProcessCache = { data, expiresAt: now + IN_PROCESS_TTL_MS };
  writeCountsToSharedCache(data).catch((err) => {
    console.error("[counts-cache] failed to write shared cache:", err);
  });

  res.setHeader("Cache-Control", "public, max-age=60");
  res.setHeader("X-Cache", "MISS");
  res.json(data);
});

router.get("/listings/mine", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const rows = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.user_id, userId))
    .orderBy(desc(listingsTable.created_at));

  res.json(rows);
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

router.post("/listings", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateListingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  const slug = await generateUniqueSlug(parsed.data.title);

  const [row] = await db
    .insert(listingsTable)
    .values({
      ...parsed.data,
      slug,
      user_id: userId,
      status: "pending",
      featured: false,
    })
    .returning();

  res.status(201).json(row);
});

router.put("/listings/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [existing] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, req.params.id))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.user_id !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (existing.status === "published") {
    res.status(409).json({ error: "Published listings cannot be edited. Contact support to unpublish first." });
    return;
  }

  const parsed = UpdateListingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  const [row] = await db
    .update(listingsTable)
    .set({ ...parsed.data, status: "pending" })
    .where(eq(listingsTable.id, req.params.id))
    .returning();

  res.json(row);
});

router.delete("/listings/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [existing] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, req.params.id))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.user_id !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(listingsTable).where(eq(listingsTable.id, req.params.id));

  if (existing.status === "published") {
    invalidateCountsCache();
  }

  res.status(204).end();
});

export default router;
