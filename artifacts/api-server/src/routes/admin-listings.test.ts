/**
 * Behavioral tests for GET /api/admin/listings
 *
 * The endpoint returns { listings, total } and supports limit/offset
 * pagination combined with search and category filters.
 *
 * Authentication is bypassed by mocking requireAdmin so these tests focus
 * entirely on the route's filtering and pagination logic.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

// ---------------------------------------------------------------------------
// Hoisted shared state
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;
type Predicate = (row: Row) => boolean;

const { mockDb, DATASET, mockIlike, mockEq, mockAnd, mockDesc, mockSql } = vi.hoisted(() => {
  // Dataset: 5 pending + 2 published, mixed categories, to exercise pagination
  const DATASET: Row[] = [
    { id: "p-1", status: "pending", title: "Χώρος Ιατρείου Α", category: "spaces",    created_at: new Date("2024-01-07") },
    { id: "p-2", status: "pending", title: "Χώρος Ιατρείου Β", category: "spaces",    created_at: new Date("2024-01-06") },
    { id: "p-3", status: "pending", title: "Χώρος Ιατρείου Γ", category: "spaces",    created_at: new Date("2024-01-05") },
    { id: "p-4", status: "pending", title: "Εξοπλισμός Α",     category: "equipment", created_at: new Date("2024-01-04") },
    { id: "p-5", status: "pending", title: "Εξοπλισμός Β",     category: "equipment", created_at: new Date("2024-01-03") },
    { id: "pub-1", status: "published", title: "Δημοσιευμένος Χώρος",      category: "spaces",    created_at: new Date("2024-01-02") },
    { id: "pub-2", status: "published", title: "Δημοσιευμένος Εξοπλισμός", category: "equipment", created_at: new Date("2024-01-01") },
  ];

  const mockIlike = vi.fn((col: string, pattern: string): Predicate => {
    const inner = pattern.replace(/%/g, "");
    const regex = new RegExp(inner, "i");
    return (row) => row[col] != null && regex.test(String(row[col]));
  });

  const mockEq = vi.fn((col: string, val: unknown): Predicate => {
    return (row) => String(row[col]) === String(val);
  });

  const mockAnd = vi.fn((...preds: Predicate[]): Predicate => {
    return (row) => preds.every((p) => p(row));
  });

  const mockDesc = vi.fn((_col: string) => ({}));
  const mockSql = vi.fn(() => ({}));

  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  return { mockDb, DATASET, mockIlike, mockEq, mockAnd, mockDesc, mockSql };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// Bypass requireAdmin so tests focus on the route logic, not auth
vi.mock("../middlewares/requireAdmin.js", () => ({
  requireAdmin: vi.fn(
    (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  ),
}));

vi.mock("@clerk/express", () => ({
  getAuth: vi.fn(() => ({ userId: "admin-user-id" })),
  clerkMiddleware:
    () =>
    (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
}));

vi.mock("drizzle-orm", () => ({
  eq:     mockEq,
  and:    mockAnd,
  ilike:  mockIlike,
  desc:   mockDesc,
  sql:    mockSql,
  or:     vi.fn((...preds: Predicate[]) => (row: Row) => preds.some((p) => p(row))),
  gte:    vi.fn(() => () => true),
  lte:    vi.fn(() => () => true),
  like:   vi.fn(() => () => true),
}));

vi.mock("@workspace/db", () => ({
  db:                      mockDb,
  listingsTable:           { status: "status", category: "category", title: "title", created_at: "created_at", id: "id", user_id: "user_id" },
  userRolesTable:          { user_id: "user_id", role: "role" },
  doctorProfilesTable:     {},
  clinicClaimsTable:       {},
  clinicClaimAuditLogTable:{},
  eq:    mockEq,
  and:   mockAnd,
  ilike: mockIlike,
  desc:  mockDesc,
  sql:   mockSql,
  or:    vi.fn(),
  gte:   vi.fn(() => () => true),
  lte:   vi.fn(() => () => true),
  like:  vi.fn(() => () => true),
}));

vi.mock("../lib/listingEmail.js", () => ({
  notifySellerOfListingStatusChange: vi.fn(),
}));

vi.mock("../lib/logger.js", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

// admin.ts imports invalidateCountsCache from ./listings
vi.mock("./listings.js", () => ({
  invalidateCountsCache: vi.fn(),
  default: express.Router(),
}));

import adminRouter from "./admin.js";
import { invalidateCountsCache } from "./listings.js";
import { notifySellerOfListingStatusChange } from "../lib/listingEmail.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", adminRouter);
  return app;
}

/**
 * Smart DB mock that handles the two parallel selects the route makes:
 *  1. rows select  – resolves at .offset() after applying predicate+limit+offset
 *  2. count select – resolves at .where() returning [{ count: N }]
 *
 * The count query is identified by a `count` key in the fields object passed
 * to db.select({ count: sql`count(*)` }).
 */
function setupDbMock() {
  mockDb.select.mockImplementation((fields?: Record<string, unknown>) => {
    const isCount =
      fields != null && typeof fields === "object" && "count" in fields;

    let predicate: Predicate | undefined;
    let limitN = 200;

    const chain: Record<string, unknown> = {};

    chain.from = vi.fn(() => chain);

    chain.where = vi.fn((pred: Predicate) => {
      predicate = pred;
      if (isCount) {
        const filtered = DATASET.filter((r) => (predicate ? predicate(r) : true));
        return Promise.resolve([{ count: filtered.length }]);
      }
      return chain;
    });

    chain.orderBy = vi.fn(() => chain);

    chain.limit = vi.fn((n: number) => {
      limitN = n;
      return chain;
    });

    chain.offset = vi.fn((off: number) => {
      const filtered = DATASET.filter((r) => (predicate ? predicate(r) : true));
      return Promise.resolve(filtered.slice(off, off + limitN));
    });

    return chain;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setupDbMock();
});

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

describe("GET /api/admin/listings — response shape", () => {
  it("returns an object with listings array and total, not a bare array", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/admin/listings");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("listings");
    expect(res.body).toHaveProperty("total");
    expect(Array.isArray(res.body.listings)).toBe(true);
    expect(typeof res.body.total).toBe("number");
  });

  it("total reflects the full filtered count, not just the current page size", async () => {
    const app = buildApp();
    // There are 5 pending listings; request only 2 per page
    const res = await request(app).get("/api/admin/listings?limit=2&offset=0");
    expect(res.status).toBe(200);
    expect(res.body.listings).toHaveLength(2);
    expect(res.body.total).toBe(5); // all 5 pending, not just the 2 returned
  });
});

// ---------------------------------------------------------------------------
// Default status filter
// ---------------------------------------------------------------------------

describe("GET /api/admin/listings — default status filter", () => {
  it("returns only pending listings when no status is specified", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/admin/listings");
    expect(res.status).toBe(200);
    const ids: string[] = res.body.listings.map((r: Row) => r.id);
    expect(ids).toContain("p-1");
    expect(ids).toContain("p-4");
    expect(ids).not.toContain("pub-1");
    expect(ids).not.toContain("pub-2");
  });

  it("returns published listings when status=published is specified", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/admin/listings?status=published");
    expect(res.status).toBe(200);
    const ids: string[] = res.body.listings.map((r: Row) => r.id);
    expect(ids).toContain("pub-1");
    expect(ids).toContain("pub-2");
    expect(ids).not.toContain("p-1");
  });
});

// ---------------------------------------------------------------------------
// Pagination: limit / offset slicing
// ---------------------------------------------------------------------------

describe("GET /api/admin/listings — limit/offset pagination", () => {
  it("respects the limit parameter and returns at most that many listings", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/admin/listings?limit=2");
    expect(res.status).toBe(200);
    expect(res.body.listings).toHaveLength(2);
  });

  it("returns the correct slice when offset advances the page", async () => {
    const app = buildApp();
    const resPage1 = await request(app).get("/api/admin/listings?limit=2&offset=0");
    const resPage2 = await request(app).get("/api/admin/listings?limit=2&offset=2");

    expect(resPage1.status).toBe(200);
    expect(resPage2.status).toBe(200);

    const page1Ids: string[] = resPage1.body.listings.map((r: Row) => r.id);
    const page2Ids: string[] = resPage2.body.listings.map((r: Row) => r.id);

    // No overlap between pages
    const overlap = page1Ids.filter((id) => page2Ids.includes(id));
    expect(overlap).toHaveLength(0);
  });

  it("returns all items across two pages when limit×2 covers the full set", async () => {
    const app = buildApp();
    const resPage1 = await request(app).get("/api/admin/listings?limit=3&offset=0");
    const resPage2 = await request(app).get("/api/admin/listings?limit=3&offset=3");

    const allIds = [
      ...resPage1.body.listings.map((r: Row) => r.id),
      ...resPage2.body.listings.map((r: Row) => r.id),
    ];

    // 5 pending total, 3+2 = 5 across both pages
    expect(allIds).toHaveLength(5);
    expect(new Set(allIds).size).toBe(5); // all unique
  });

  it("returns an empty listings array when offset exceeds the total count", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/admin/listings?offset=100");
    expect(res.status).toBe(200);
    expect(res.body.listings).toHaveLength(0);
    expect(res.body.total).toBe(5); // total is still the full count
  });
});

// ---------------------------------------------------------------------------
// Category filter
// ---------------------------------------------------------------------------

describe("GET /api/admin/listings — category filter", () => {
  it("returns only listings matching the requested category", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/admin/listings?category=equipment");
    expect(res.status).toBe(200);
    const ids: string[] = res.body.listings.map((r: Row) => r.id);
    expect(ids).toContain("p-4");
    expect(ids).toContain("p-5");
    expect(ids).not.toContain("p-1");
    expect(ids).not.toContain("p-2");
  });

  it("returns an empty list for a category with no matching listings", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/admin/listings?category=jobs");
    expect(res.status).toBe(200);
    expect(res.body.listings).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Search filter
// ---------------------------------------------------------------------------

describe("GET /api/admin/listings — search filter", () => {
  it("returns only listings whose title matches the search term", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/admin/listings?search=Εξοπλισμός");
    expect(res.status).toBe(200);
    const ids: string[] = res.body.listings.map((r: Row) => r.id);
    expect(ids).toContain("p-4");
    expect(ids).toContain("p-5");
    expect(ids).not.toContain("p-1");
  });

  it("is case-insensitive", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/admin/listings?search=εξοπλισμός");
    expect(res.status).toBe(200);
    const ids: string[] = res.body.listings.map((r: Row) => r.id);
    expect(ids).toContain("p-4");
    expect(ids).toContain("p-5");
  });

  it("returns an empty list when no title matches the search term", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/admin/listings?search=ανύπαρκτο");
    expect(res.status).toBe(200);
    expect(res.body.listings).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Combined filters: category + search + pagination
// ---------------------------------------------------------------------------

describe("GET /api/admin/listings — combined filters with pagination", () => {
  it("applies category and search together, narrowing the result set", async () => {
    const app = buildApp();
    // "Χώρος" matches p-1, p-2, p-3 (all spaces); category=spaces should not change the result
    const res = await request(app).get(
      "/api/admin/listings?category=spaces&search=Χώρος",
    );
    expect(res.status).toBe(200);
    const ids: string[] = res.body.listings.map((r: Row) => r.id);
    expect(ids).toContain("p-1");
    expect(ids).toContain("p-2");
    expect(ids).toContain("p-3");
    expect(ids).not.toContain("p-4"); // equipment, excluded by category
  });

  it("returns empty when search matches but category does not", async () => {
    const app = buildApp();
    // "Εξοπλισμός" exists in equipment; requesting spaces should give 0 results
    const res = await request(app).get(
      "/api/admin/listings?category=spaces&search=Εξοπλισμός",
    );
    expect(res.status).toBe(200);
    expect(res.body.listings).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it("paginates correctly on a filtered subset (category + limit + offset)", async () => {
    const app = buildApp();
    // spaces category has 3 pending listings; page them 2 at a time
    const resPage1 = await request(app).get(
      "/api/admin/listings?category=spaces&limit=2&offset=0",
    );
    const resPage2 = await request(app).get(
      "/api/admin/listings?category=spaces&limit=2&offset=2",
    );

    expect(resPage1.status).toBe(200);
    expect(resPage2.status).toBe(200);

    expect(resPage1.body.total).toBe(3);
    expect(resPage2.body.total).toBe(3);

    expect(resPage1.body.listings).toHaveLength(2);
    expect(resPage2.body.listings).toHaveLength(1);

    const allIds = [
      ...resPage1.body.listings.map((r: Row) => r.id),
      ...resPage2.body.listings.map((r: Row) => r.id),
    ];
    expect(new Set(allIds).size).toBe(3);
  });

  it("paginates correctly with all three filters: status + category + search + offset", async () => {
    const app = buildApp();
    const res = await request(app).get(
      "/api/admin/listings?status=pending&category=spaces&search=Χώρος&limit=1&offset=1",
    );
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3); // 3 match status+category+search
    expect(res.body.listings).toHaveLength(1); // only 1 returned due to limit
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/listings/:id — helpers
// ---------------------------------------------------------------------------

type PatchMockOpts = {
  existingStatus: string | null;
  updatedRow?: Row;
};

function setupPatchDbMock({ existingStatus, updatedRow }: PatchMockOpts) {
  mockDb.select.mockImplementation(() => {
    const chain: Record<string, unknown> = {};
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.limit = vi.fn(() =>
      Promise.resolve(existingStatus === null ? [] : [{ status: existingStatus }]),
    );
    return chain;
  });

  mockDb.update.mockImplementation(() => {
    const chain: Record<string, unknown> = {};
    chain.set = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.returning = vi.fn(() =>
      Promise.resolve(updatedRow ? [updatedRow] : []),
    );
    return chain;
  });

  // The route calls .catch() on the return value, so the mock must return a Promise
  vi.mocked(notifySellerOfListingStatusChange).mockResolvedValue(undefined);
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/listings/:id — status update
// ---------------------------------------------------------------------------

describe("PATCH /api/admin/listings/:id — status update", () => {
  it("returns 200 and the updated row when a valid status is provided", async () => {
    const updated: Row = { id: "p-1", status: "published", title: "Χώρος Α", user_id: "u-1", category: "spaces" };
    setupPatchDbMock({ existingStatus: "pending", updatedRow: updated });

    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/listings/p-1")
      .send({ status: "published" });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("p-1");
    expect(res.body.status).toBe("published");
  });

  it("returns 400 when an invalid status value is provided", async () => {
    setupPatchDbMock({ existingStatus: "pending" });

    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/listings/p-1")
      .send({ status: "bogus" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when the request body has no status field", async () => {
    setupPatchDbMock({ existingStatus: "pending" });

    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/listings/p-1")
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 404 when the listing ID does not exist", async () => {
    setupPatchDbMock({ existingStatus: null });

    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/listings/nonexistent-id")
      .send({ status: "published" });

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/listings/:id — invalidateCountsCache behaviour
// ---------------------------------------------------------------------------

describe("PATCH /api/admin/listings/:id — invalidateCountsCache", () => {
  it("calls invalidateCountsCache when transitioning TO published", async () => {
    const updated: Row = { id: "p-1", status: "published", title: "Χώρος Α", user_id: "u-1", category: "spaces" };
    setupPatchDbMock({ existingStatus: "pending", updatedRow: updated });

    const app = buildApp();
    await request(app).patch("/api/admin/listings/p-1").send({ status: "published" });

    expect(invalidateCountsCache).toHaveBeenCalledOnce();
  });

  it("calls invalidateCountsCache when transitioning FROM published to another status", async () => {
    const updated: Row = { id: "pub-1", status: "archived", title: "Χώρος Α", user_id: "u-1", category: "spaces" };
    setupPatchDbMock({ existingStatus: "published", updatedRow: updated });

    const app = buildApp();
    await request(app).patch("/api/admin/listings/pub-1").send({ status: "archived" });

    expect(invalidateCountsCache).toHaveBeenCalledOnce();
  });

  it("does not call invalidateCountsCache when transitioning between two non-published statuses", async () => {
    const updated: Row = { id: "p-1", status: "archived", title: "Χώρος Α", user_id: "u-1", category: "spaces" };
    setupPatchDbMock({ existingStatus: "pending", updatedRow: updated });

    const app = buildApp();
    await request(app).patch("/api/admin/listings/p-1").send({ status: "archived" });

    expect(invalidateCountsCache).not.toHaveBeenCalled();
  });

  it("calls invalidateCountsCache when the target status is published, even if it was already published", async () => {
    const updated: Row = { id: "pub-1", status: "published", title: "Χώρος Α", user_id: "u-1", category: "spaces" };
    setupPatchDbMock({ existingStatus: "published", updatedRow: updated });

    const app = buildApp();
    await request(app).patch("/api/admin/listings/pub-1").send({ status: "published" });

    expect(invalidateCountsCache).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/listings/:id — notifySellerOfListingStatusChange behaviour
// ---------------------------------------------------------------------------

describe("PATCH /api/admin/listings/:id — notifySellerOfListingStatusChange", () => {
  it("calls notifySellerOfListingStatusChange when transitioning to published", async () => {
    const updated: Row = { id: "p-1", status: "published", title: "Χώρος Α", user_id: "u-1", category: "spaces" };
    setupPatchDbMock({ existingStatus: "pending", updatedRow: updated });

    const app = buildApp();
    await request(app).patch("/api/admin/listings/p-1").send({ status: "published" });

    expect(notifySellerOfListingStatusChange).toHaveBeenCalledOnce();
    expect(notifySellerOfListingStatusChange).toHaveBeenCalledWith("u-1", "Χώρος Α", "published");
  });

  it("calls notifySellerOfListingStatusChange when transitioning to archived", async () => {
    const updated: Row = { id: "p-1", status: "archived", title: "Χώρος Α", user_id: "u-1", category: "spaces" };
    setupPatchDbMock({ existingStatus: "pending", updatedRow: updated });

    const app = buildApp();
    await request(app).patch("/api/admin/listings/p-1").send({ status: "archived" });

    expect(notifySellerOfListingStatusChange).toHaveBeenCalledOnce();
    expect(notifySellerOfListingStatusChange).toHaveBeenCalledWith("u-1", "Χώρος Α", "archived");
  });

  it("does not call notifySellerOfListingStatusChange when transitioning to draft", async () => {
    const updated: Row = { id: "p-1", status: "draft", title: "Χώρος Α", user_id: "u-1", category: "spaces" };
    setupPatchDbMock({ existingStatus: "pending", updatedRow: updated });

    const app = buildApp();
    await request(app).patch("/api/admin/listings/p-1").send({ status: "draft" });

    expect(notifySellerOfListingStatusChange).not.toHaveBeenCalled();
  });

  it("does not call notifySellerOfListingStatusChange when the status does not change", async () => {
    const updated: Row = { id: "pub-1", status: "published", title: "Χώρος Α", user_id: "u-1", category: "spaces" };
    setupPatchDbMock({ existingStatus: "published", updatedRow: updated });

    const app = buildApp();
    await request(app).patch("/api/admin/listings/pub-1").send({ status: "published" });

    expect(notifySellerOfListingStatusChange).not.toHaveBeenCalled();
  });

  it("does not call notifySellerOfListingStatusChange when the listing has no user_id", async () => {
    const updated: Row = { id: "p-1", status: "published", title: "Χώρος Α", user_id: null, category: "spaces" };
    setupPatchDbMock({ existingStatus: "pending", updatedRow: updated });

    const app = buildApp();
    await request(app).patch("/api/admin/listings/p-1").send({ status: "published" });

    expect(notifySellerOfListingStatusChange).not.toHaveBeenCalled();
  });
});
