import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { listingsTable, listingCountsCacheTable } from "@workspace/db";
import { eq, and, or, desc, count, ilike } from "drizzle-orm";
import { CreateListingBody, UpdateListingBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/requireAdmin";

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

interface CacheMetrics {
  hits_process: number;
  hits_db: number;
  misses: number;
  stale_db_rows: number;
  invalidations: number;
  last_invalidation_at: string | null;
  last_invalidation_caller: string | null;
  last_stale_row_age_ms: number | null;
}

const cacheMetrics: CacheMetrics = {
  hits_process: 0,
  hits_db: 0,
  misses: 0,
  stale_db_rows: 0,
  invalidations: 0,
  last_invalidation_at: null,
  last_invalidation_caller: null,
  last_stale_row_age_ms: null,
};

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

export function invalidateCountsCache(caller = "unknown"): void {
  const ts = new Date().toISOString();
  inProcessCache = null;
  cacheMetrics.invalidations += 1;
  cacheMetrics.last_invalidation_at = ts;
  cacheMetrics.last_invalidation_caller = caller;
  console.log(`[counts-cache] INVALIDATE caller=${caller} at=${ts}`);
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

router.get("/listings/counts/metrics", requireAdmin, async (req, res) => {
  res.json({ ...cacheMetrics });
});

router.post("/listings/counts/metrics/reset", requireAdmin, async (req, res) => {
  const { userId } = getAuth(req);

  cacheMetrics.hits_process = 0;
  cacheMetrics.hits_db = 0;
  cacheMetrics.misses = 0;
  cacheMetrics.stale_db_rows = 0;
  cacheMetrics.invalidations = 0;
  cacheMetrics.last_invalidation_at = null;
  cacheMetrics.last_invalidation_caller = null;
  cacheMetrics.last_stale_row_age_ms = null;

  const ts = new Date().toISOString();
  console.log(`[counts-cache] METRICS RESET at=${ts} by=${userId}`);

  res.json({ reset: true, at: ts, by: userId });
});

router.get("/listings/counts", async (req, res) => {
  const now = Date.now();

  if (inProcessCache && now < inProcessCache.expiresAt) {
    cacheMetrics.hits_process += 1;
    const ttlRemaining = inProcessCache.expiresAt - now;
    console.log(`[counts-cache] HIT-PROCESS ttl_remaining_ms=${ttlRemaining}`);
    res.setHeader("Cache-Control", "public, max-age=60");
    res.setHeader("X-Cache", "HIT-PROCESS");
    res.json(inProcessCache.data);
    return;
  }

  const sharedRow = await (async () => {
    const [row] = await db
      .select()
      .from(listingCountsCacheTable)
      .where(eq(listingCountsCacheTable.id, CACHE_ROW_ID))
      .limit(1);
    return row ?? null;
  })();

  if (sharedRow) {
    const ageMs = now - new Date(sharedRow.updated_at).getTime();
    if (ageMs <= COUNTS_CACHE_TTL_MS) {
      const shared = sharedRow.counts as Record<string, number>;
      inProcessCache = { data: shared, expiresAt: now + IN_PROCESS_TTL_MS };
      cacheMetrics.hits_db += 1;
      console.log(`[counts-cache] HIT-DB age_ms=${ageMs}`);
      res.setHeader("Cache-Control", "public, max-age=60");
      res.setHeader("X-Cache", "HIT-DB");
      res.setHeader("X-Cache-Age-Ms", String(ageMs));
      res.json(shared);
      return;
    }
    cacheMetrics.stale_db_rows += 1;
    cacheMetrics.last_stale_row_age_ms = now - new Date(sharedRow.updated_at).getTime();
    console.log(`[counts-cache] STALE-DB age_ms=${cacheMetrics.last_stale_row_age_ms} ttl_ms=${COUNTS_CACHE_TTL_MS}`);
  }

  const data = await fetchCountsFromDb();
  inProcessCache = { data, expiresAt: now + IN_PROCESS_TTL_MS };
  writeCountsToSharedCache(data).catch((err) => {
    console.error("[counts-cache] failed to write shared cache:", err);
  });
  cacheMetrics.misses += 1;
  const staleAgeMs = sharedRow ? now - new Date(sharedRow.updated_at).getTime() : null;
  console.log(`[counts-cache] MISS fetched fresh counts from DB${staleAgeMs !== null ? ` stale_row_age_ms=${staleAgeMs}` : ""}`);

  res.setHeader("Cache-Control", "public, max-age=60");
  res.setHeader("X-Cache", "MISS");
  if (staleAgeMs !== null) res.setHeader("X-Cache-Stale-Age-Ms", String(staleAgeMs));
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
  const { category, featured, limit = "50", q, city } = req.query as Record<string, string>;
  const lim = Math.min(parseInt(limit) || 50, 200);

  const conditions = [eq(listingsTable.status, "published")];
  if (category) conditions.push(eq(listingsTable.category, category));
  if (featured === "true") conditions.push(eq(listingsTable.featured, true));
  if (city) conditions.push(ilike(listingsTable.city, `%${city}%`));
  if (q) {
    const pattern = `%${q}%`;
    conditions.push(
      or(
        ilike(listingsTable.title, pattern),
        ilike(listingsTable.meta, pattern),
        ilike(listingsTable.description, pattern),
      )!,
    );
  }

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
    invalidateCountsCache("DELETE /api/listings/:id");
  }

  res.status(204).end();
});

export default router;
