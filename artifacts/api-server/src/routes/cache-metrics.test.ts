import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

const { mockGetAuth, mockDb } = vi.hoisted(() => {
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const mockGetAuth = vi.fn<() => { userId: string | null | undefined }>(() => ({ userId: "admin-user-id" }));
  return { mockGetAuth, mockDb };
});

vi.mock("@clerk/express", () => ({
  getAuth: mockGetAuth,
  clerkMiddleware: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  clerkClient: { users: { getUser: vi.fn().mockResolvedValue({ emailAddresses: [], primaryEmailAddressId: null }) } },
}));

vi.mock("../lib/listingEmail.js", () => ({
  notifySellerOfListingStatusChange: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@workspace/db", () => ({
  db: mockDb,
  listingsTable: {},
  listingCountsCacheTable: {},
  userRolesTable: {},
  doctorProfilesTable: {},
  clinicClaimsTable: {},
  clinicClaimAuditLogTable: {},
  eq: vi.fn(() => ({})),
  and: vi.fn(() => ({})),
  desc: vi.fn(() => ({})),
  count: vi.fn(() => ({})),
  sql: vi.fn(() => ({})),
  gte: vi.fn(() => ({})),
  lte: vi.fn(() => ({})),
  like: vi.fn(() => ({})),
  ilike: vi.fn(() => ({})),
  or: vi.fn(() => ({})),
}));

import listingsRouter, { invalidateCountsCache } from "./listings.js";
import adminRouter from "./admin.js";

function makeChain<T>(value: T) {
  const p = Promise.resolve(value);
  const proxy: Record<string, unknown> = new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === "then") return p.then.bind(p);
        if (prop === "catch") return p.catch.bind(p);
        if (prop === "finally") return p.finally.bind(p);
        return () => proxy;
      },
    },
  );
  return proxy;
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", listingsRouter);
  app.use("/api", adminRouter);
  return app;
}

const MOCK_ADMIN_ROW = {
  id: "role-1",
  user_id: "admin-user-id",
  role: "admin",
};

const MOCK_LISTING_PUBLISHED = {
  id: "listing-pub",
  user_id: "seller-user-id",
  status: "published",
  title: "Published Listing",
  category: "spaces",
  slug: "published-listing-abc",
  featured: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_LISTING_PENDING = {
  ...MOCK_LISTING_PUBLISHED,
  id: "listing-pend",
  status: "pending",
  slug: "pending-listing-abc",
};

async function resetMetrics() {
  vi.clearAllMocks();
  mockGetAuth.mockReturnValue({ userId: "admin-user-id" });
  mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
  mockDb.insert.mockReturnValue(makeChain([]));
  mockDb.update.mockReturnValue(makeChain([]));
  mockDb.delete.mockReturnValue(makeChain([]));
  await request(buildApp()).post("/api/listings/counts/metrics/reset");
  invalidateCountsCache("test-teardown");
}

beforeEach(async () => {
  await resetMetrics();
});

// ---------------------------------------------------------------------------
// GET /api/listings/counts/metrics
// ---------------------------------------------------------------------------
describe("GET /api/listings/counts/metrics", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetAuth.mockReturnValue({ userId: null });
    const app = buildApp();
    const res = await request(app).get("/api/listings/counts/metrics");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 403 when the user is not an admin", async () => {
    mockGetAuth.mockReturnValue({ userId: "non-admin-id" });
    mockDb.select.mockReturnValue(makeChain([]));
    const app = buildApp();
    const res = await request(app).get("/api/listings/counts/metrics");
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 200 with all expected counter fields and correct types when authenticated as admin", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const app = buildApp();
    const res = await request(app).get("/api/listings/counts/metrics");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("hits_process");
    expect(res.body).toHaveProperty("hits_db");
    expect(res.body).toHaveProperty("misses");
    expect(res.body).toHaveProperty("stale_db_rows");
    expect(res.body).toHaveProperty("invalidations");
    expect(res.body).toHaveProperty("last_invalidation_at");
    expect(res.body).toHaveProperty("last_invalidation_caller");
    expect(res.body).toHaveProperty("last_stale_row_age_ms");
    expect(typeof res.body.hits_process).toBe("number");
    expect(typeof res.body.hits_db).toBe("number");
    expect(typeof res.body.misses).toBe("number");
    expect(typeof res.body.stale_db_rows).toBe("number");
    expect(typeof res.body.invalidations).toBe("number");
  });
});

// ---------------------------------------------------------------------------
// POST /api/listings/counts/metrics/reset
// ---------------------------------------------------------------------------
describe("POST /api/listings/counts/metrics/reset", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetAuth.mockReturnValue({ userId: null });
    const app = buildApp();
    const res = await request(app).post("/api/listings/counts/metrics/reset");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 403 when the user is not an admin", async () => {
    mockGetAuth.mockReturnValue({ userId: "non-admin-id" });
    mockDb.select.mockReturnValue(makeChain([]));
    const app = buildApp();
    const res = await request(app).post("/api/listings/counts/metrics/reset");
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 200 with reset=true, a valid ISO timestamp, and the caller user ID when authenticated as admin", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const app = buildApp();
    const beforeMs = Date.now();
    const res = await request(app).post("/api/listings/counts/metrics/reset");
    const afterMs = Date.now();
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("reset", true);
    expect(res.body).toHaveProperty("by", "admin-user-id");
    expect(res.body).toHaveProperty("at");
    const atMs = new Date(res.body.at).getTime();
    expect(Number.isNaN(atMs)).toBe(false);
    expect(atMs).toBeGreaterThanOrEqual(beforeMs);
    expect(atMs).toBeLessThanOrEqual(afterMs);
  });

  it("resets all counters to zero given non-zero preconditions", async () => {
    const app = buildApp();

    mockDb.select.mockReturnValue(makeChain([]));
    mockDb.insert.mockReturnValue(makeChain([]));
    await request(app).get("/api/listings/counts");

    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const metricsBefore = await request(app).get("/api/listings/counts/metrics");
    expect(metricsBefore.status).toBe(200);
    expect(metricsBefore.body.misses).toBeGreaterThan(0);
    expect(metricsBefore.body.invalidations).toBeGreaterThan(0);

    const resetRes = await request(app).post("/api/listings/counts/metrics/reset");
    expect(resetRes.status).toBe(200);

    const metricsAfter = await request(app).get("/api/listings/counts/metrics");
    expect(metricsAfter.status).toBe(200);
    expect(metricsAfter.body.hits_process).toBe(0);
    expect(metricsAfter.body.hits_db).toBe(0);
    expect(metricsAfter.body.misses).toBe(0);
    expect(metricsAfter.body.stale_db_rows).toBe(0);
    expect(metricsAfter.body.invalidations).toBe(0);
    expect(metricsAfter.body.last_invalidation_at).toBeNull();
    expect(metricsAfter.body.last_invalidation_caller).toBeNull();
    expect(metricsAfter.body.last_stale_row_age_ms).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Cache invalidation: seller DELETE /api/listings/:id
// ---------------------------------------------------------------------------
describe("cache invalidation: DELETE /api/listings/:id", () => {
  it("increments the invalidations counter when a published listing is deleted", async () => {
    const app = buildApp();

    mockGetAuth.mockReturnValue({ userId: "seller-user-id" });
    mockDb.select.mockReturnValue(makeChain([MOCK_LISTING_PUBLISHED]));
    mockDb.delete.mockReturnValue(makeChain([]));
    await request(app).delete("/api/listings/listing-pub");

    mockGetAuth.mockReturnValue({ userId: "admin-user-id" });
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const metricsRes = await request(app).get("/api/listings/counts/metrics");
    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.invalidations).toBeGreaterThan(0);
    expect(metricsRes.body.last_invalidation_caller).toBe("DELETE /api/listings/:id");
  });

  it("does not increment the invalidations counter when a non-published listing is deleted", async () => {
    const app = buildApp();

    mockGetAuth.mockReturnValue({ userId: "admin-user-id" });
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const metricsBefore = await request(app).get("/api/listings/counts/metrics");
    const invalidationsBefore = metricsBefore.body.invalidations as number;

    mockGetAuth.mockReturnValue({ userId: "seller-user-id" });
    mockDb.select.mockReturnValue(makeChain([MOCK_LISTING_PENDING]));
    mockDb.delete.mockReturnValue(makeChain([]));
    await request(app).delete("/api/listings/listing-pend");

    mockGetAuth.mockReturnValue({ userId: "admin-user-id" });
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const metricsAfter = await request(app).get("/api/listings/counts/metrics");
    expect(metricsAfter.status).toBe(200);
    expect(metricsAfter.body.invalidations).toBe(invalidationsBefore);
  });
});

// ---------------------------------------------------------------------------
// Cache invalidation: admin PATCH /api/admin/listings/:id
// ---------------------------------------------------------------------------
describe("cache invalidation: PATCH /api/admin/listings/:id", () => {
  it("increments the invalidations counter when a pending listing is published", async () => {
    const app = buildApp();

    mockGetAuth.mockReturnValue({ userId: "admin-user-id" });
    mockDb.select
      .mockReturnValueOnce(makeChain([MOCK_ADMIN_ROW]))
      .mockReturnValueOnce(makeChain([{ status: "pending" }]));
    mockDb.update.mockReturnValue(makeChain([{ ...MOCK_LISTING_PUBLISHED, user_id: null }]));
    await request(app).patch("/api/admin/listings/listing-pub").send({ status: "published" });

    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const metricsRes = await request(app).get("/api/listings/counts/metrics");
    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.invalidations).toBeGreaterThan(0);
    expect(metricsRes.body.last_invalidation_caller).toBe("PATCH /api/admin/listings/:id");
  });

  it("increments the invalidations counter when a published listing is archived", async () => {
    const app = buildApp();

    mockGetAuth.mockReturnValue({ userId: "admin-user-id" });
    mockDb.select
      .mockReturnValueOnce(makeChain([MOCK_ADMIN_ROW]))
      .mockReturnValueOnce(makeChain([{ status: "published" }]));
    mockDb.update.mockReturnValue(makeChain([{ ...MOCK_LISTING_PUBLISHED, status: "archived", user_id: null }]));
    await request(app).patch("/api/admin/listings/listing-pub").send({ status: "archived" });

    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const metricsRes = await request(app).get("/api/listings/counts/metrics");
    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.invalidations).toBeGreaterThan(0);
    expect(metricsRes.body.last_invalidation_caller).toBe("PATCH /api/admin/listings/:id");
  });

  it("does not increment the invalidations counter when transitioning between two non-published statuses", async () => {
    const app = buildApp();

    mockGetAuth.mockReturnValue({ userId: "admin-user-id" });
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const metricsBefore = await request(app).get("/api/listings/counts/metrics");
    const invalidationsBefore = metricsBefore.body.invalidations as number;

    mockDb.select
      .mockReturnValueOnce(makeChain([MOCK_ADMIN_ROW]))
      .mockReturnValueOnce(makeChain([{ status: "pending" }]));
    mockDb.update.mockReturnValue(makeChain([{ ...MOCK_LISTING_PENDING, status: "archived", user_id: null }]));
    await request(app).patch("/api/admin/listings/listing-pend").send({ status: "archived" });

    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const metricsAfter = await request(app).get("/api/listings/counts/metrics");
    expect(metricsAfter.status).toBe(200);
    expect(metricsAfter.body.invalidations).toBe(invalidationsBefore);
  });
});
