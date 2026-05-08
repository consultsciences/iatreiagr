/**
 * Behavioral tests for GET /api/listings search and filter functionality.
 *
 * Rather than mocking the DB to return a hardcoded payload (which would be
 * tautological), these tests use a predicate-based smart mock that actually
 * applies the ilike / eq / and / or conditions the route constructs in
 * JavaScript, so the assertions reflect real filtering behavior against a
 * dataset that contains both matching and non-matching rows.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

// ---------------------------------------------------------------------------
// Predicate-based mocks for drizzle-orm filter helpers
// ---------------------------------------------------------------------------
// Each mock returns a JavaScript predicate function (row) => boolean so the
// smart DB mock can filter the in-memory dataset at .limit() time.

type Row = Record<string, unknown>;
type Predicate = (row: Row) => boolean;

const { mockDb, DATASET, mockIlike, mockOr, mockEq, mockAnd, mockDesc, mockCount } = vi.hoisted(() => {
  // Listings dataset: contains both matching and non-matching rows
  const DATASET: Row[] = [
    {
      id: "pub-1",
      status: "published",
      title: "Οδοντιατρείο κέντρο",
      meta: "οδοντιατρείο κλινική",
      description: "Σύγχρονο οδοντιατρείο",
      category: "spaces",
      city: "Αθήνα",
      featured: false,
      slug: "odontiatreio",
      created_at: new Date("2024-01-01"),
    },
    {
      id: "pub-2",
      status: "published",
      title: "Υπερηχογράφος Siemens",
      meta: "υπερηχογράφος διαγνωστικό",
      description: "Μεταχειρισμένος υπερηχογράφος",
      category: "equipment",
      city: "Θεσσαλονίκη",
      featured: true,
      slug: "yperhxografos",
      created_at: new Date("2024-01-02"),
    },
    {
      id: "pub-3",
      status: "published",
      title: "Θέση νοσηλευτή",
      meta: "νοσηλευτής εργασία",
      description: "Αναζητούμε νοσηλευτή",
      category: "jobs",
      city: "Αθήνα",
      featured: false,
      slug: "thesi-nosilefti",
      created_at: new Date("2024-01-03"),
    },
    {
      id: "pending-1",
      status: "pending",
      title: "Εκκρεμής αγγελία",
      meta: "εκκρεμής",
      description: "Δεν πρέπει να εμφανιστεί",
      category: "spaces",
      city: "Αθήνα",
      featured: false,
      slug: "pending",
      created_at: new Date("2024-01-04"),
    },
  ];

  // ilike: case-insensitive substring match on a row field
  const mockIlike = vi.fn((col: string, pattern: string): Predicate => {
    const inner = pattern.replace(/%/g, "");
    const regex = new RegExp(inner, "i");
    return (row) => row[col] != null && regex.test(String(row[col]));
  });

  // or: short-circuit OR of predicate array
  const mockOr = vi.fn((...preds: Predicate[]): Predicate => {
    return (row) => preds.some((p) => p(row));
  });

  // eq: strict equality on a row field
  const mockEq = vi.fn((col: string, val: unknown): Predicate => {
    return (row) => String(row[col]) === String(val);
  });

  // and: conjunction of all predicates
  const mockAnd = vi.fn((...preds: Predicate[]): Predicate => {
    return (row) => preds.every((p) => p(row));
  });

  const mockDesc = vi.fn((col: string) => ({ __desc: col }));
  const mockCount = vi.fn(() => ({}));

  // Smart DB that applies the where-predicate against the in-memory DATASET
  const makeSelectChain = (predicate?: Predicate, orderByCols?: unknown[], lim?: number) => {
    const chain: Record<string, unknown> = {};

    chain.select = vi.fn(() => chain);
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn((pred: Predicate) => {
      predicate = pred;
      return chain;
    });
    chain.orderBy = vi.fn((...cols: unknown[]) => {
      orderByCols = cols;
      return chain;
    });
    chain.limit = vi.fn((n: number) => {
      lim = n;
      const results = (DATASET as Row[]).filter((row) =>
        predicate ? predicate(row) : true,
      );
      return Promise.resolve(results.slice(0, lim));
    });

    // Make it thenable so the route can await it directly (not used in GET flow,
    // but guards against accidental usage)
    (chain as unknown as Promise<unknown>).then = undefined as unknown as Promise<unknown>["then"];

    return chain;
  };

  const mockDb = {
    select: vi.fn(() => makeSelectChain()),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  return { mockDb, DATASET, mockIlike, mockOr, mockEq, mockAnd, mockDesc, mockCount };
});

// ---------------------------------------------------------------------------
// Module mocks (hoisted refs are safe to reference here)
// ---------------------------------------------------------------------------

vi.mock("@clerk/express", () => ({
  getAuth: vi.fn(() => ({ userId: null })),
  clerkMiddleware: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

vi.mock("drizzle-orm", () => ({
  eq: mockEq,
  and: mockAnd,
  or: mockOr,
  ilike: mockIlike,
  desc: mockDesc,
  count: mockCount,
  sql: vi.fn(() => ({})),
  gte: vi.fn(() => () => true),
  lte: vi.fn(() => () => true),
  like: vi.fn(() => () => true),
}));

vi.mock("@workspace/db", () => ({
  db: mockDb,
  listingsTable: {
    status: "status",
    category: "category",
    featured: "featured",
    city: "city",
    title: "title",
    meta: "meta",
    description: "description",
    created_at: "created_at",
    user_id: "user_id",
    id: "id",
  },
  listingCountsCacheTable: {},
  userRolesTable: {},
  doctorProfilesTable: {},
  clinicClaimsTable: {},
  clinicClaimAuditLogTable: {},
  eq: mockEq,
  and: mockAnd,
  desc: mockDesc,
  count: mockCount,
  sql: vi.fn(() => ({})),
  gte: vi.fn(() => () => true),
  lte: vi.fn(() => () => true),
  like: vi.fn(() => () => true),
  ilike: mockIlike,
  or: mockOr,
}));

import listingsRouter from "./listings.js";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", listingsRouter);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
  // Restore the smart select chain after clearAllMocks resets call tracking
  mockDb.select.mockImplementation(() => {
    let predicate: ((row: Row) => boolean) | undefined;

    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn((pred: (row: Row) => boolean) => {
      predicate = pred;
      return chain;
    });
    chain.orderBy = vi.fn(() => chain);
    chain.limit = vi.fn((n: number) => {
      const results = DATASET.filter((row) => (predicate ? predicate(row) : true));
      return Promise.resolve(results.slice(0, n));
    });
    return chain;
  });
});

// ---------------------------------------------------------------------------
// GET /api/listings — no filters
// ---------------------------------------------------------------------------
describe("GET /api/listings (no filters)", () => {
  it("returns 200 with only published listings from the dataset", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/listings");
    expect(res.status).toBe(200);
    const ids: string[] = res.body.map((r: Row) => r.id);
    expect(ids).toContain("pub-1");
    expect(ids).toContain("pub-2");
    expect(ids).toContain("pub-3");
    expect(ids).not.toContain("pending-1");
  });
});

// ---------------------------------------------------------------------------
// GET /api/listings?q= — full-text search (title / meta / description)
// ---------------------------------------------------------------------------
describe("GET /api/listings?q= (full-text search)", () => {
  it("returns only listings matching the query in title", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/listings?q=Υπερηχογράφος");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe("pub-2");
  });

  it("returns only listings matching the query in meta", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/listings?q=κλινική");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe("pub-1");
  });

  it("returns only listings matching the query in description", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/listings?q=Αναζητούμε");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe("pub-3");
  });

  it("is case-insensitive (uppercase query matches mixed-case title)", async () => {
    const app = buildApp();
    // "Siemens" appears in pub-2 title; querying "SIEMENS" (uppercase) should still match
    const res = await request(app).get("/api/listings?q=SIEMENS");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const ids = res.body.map((r: Row) => r.id);
    expect(ids).toContain("pub-2");
  });

  it("returns an empty array when nothing matches", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/listings?q=ανύπαρκτοscενάριο");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("does not return pending listings even if query matches their text", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/listings?q=εκκρεμής");
    expect(res.status).toBe(200);
    const ids = res.body.map((r: Row) => r.id);
    expect(ids).not.toContain("pending-1");
  });
});

// ---------------------------------------------------------------------------
// GET /api/listings?city= — city filter
// ---------------------------------------------------------------------------
describe("GET /api/listings?city= (city filter)", () => {
  it("returns only listings in the specified city", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/listings?city=Αθήνα");
    expect(res.status).toBe(200);
    const ids = res.body.map((r: Row) => r.id);
    expect(ids).toContain("pub-1");
    expect(ids).toContain("pub-3");
    expect(ids).not.toContain("pub-2");
  });

  it("excludes listings from other cities", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/listings?city=Θεσσαλονίκη");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe("pub-2");
  });

  it("returns an empty array when no published listings exist in that city", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/listings?city=Ηράκλειο");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// GET /api/listings?category= — category filter
// ---------------------------------------------------------------------------
describe("GET /api/listings?category= (category filter)", () => {
  it("returns only listings in the specified category", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/listings?category=equipment");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe("pub-2");
  });

  it("excludes listings from other categories", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/listings?category=jobs");
    expect(res.status).toBe(200);
    const ids = res.body.map((r: Row) => r.id);
    expect(ids).not.toContain("pub-1");
    expect(ids).not.toContain("pub-2");
    expect(ids).toContain("pub-3");
  });

  it("returns an empty array for a valid category with no published listings", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/listings?category=supplies");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// GET /api/listings?q=...&city=...&category=... — combined filters
// ---------------------------------------------------------------------------
describe("GET /api/listings with combined q + city + category filters", () => {
  it("returns the single listing matching all three filters", async () => {
    const app = buildApp();
    const res = await request(app).get(
      "/api/listings?q=υπερηχογράφος&city=Θεσσαλονίκη&category=equipment",
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe("pub-2");
  });

  it("returns empty array when q matches but city does not", async () => {
    const app = buildApp();
    const res = await request(app).get(
      "/api/listings?q=υπερηχογράφος&city=Αθήνα&category=equipment",
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns empty array when city matches but category does not", async () => {
    const app = buildApp();
    const res = await request(app).get(
      "/api/listings?q=οδοντιατρείο&city=Αθήνα&category=equipment",
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns correct results for q + city without category", async () => {
    const app = buildApp();
    const res = await request(app).get(
      "/api/listings?q=νοσηλευτή&city=Αθήνα",
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe("pub-3");
  });

  it("returns results from multiple categories when only q + city are specified", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/listings?city=Αθήνα");
    expect(res.status).toBe(200);
    const ids = res.body.map((r: Row) => r.id);
    expect(ids).toContain("pub-1");
    expect(ids).toContain("pub-3");
    expect(ids).not.toContain("pub-2");
  });
});
