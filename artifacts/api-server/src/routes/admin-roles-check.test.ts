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
  app.use("/api", adminRouter);
  return app;
}

const MOCK_ADMIN_ROW = {
  id: "role-1",
  user_id: "admin-user-id",
  role: "admin",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAuth.mockReturnValue({ userId: "admin-user-id" });
  mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
  mockDb.insert.mockReturnValue(makeChain([]));
  mockDb.update.mockReturnValue(makeChain([]));
  mockDb.delete.mockReturnValue(makeChain([]));
});

describe("GET /api/admin/roles/check", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    mockGetAuth.mockReturnValue({ userId: null });
    const res = await request(buildApp()).get("/api/admin/roles/check");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("returns { is_admin: false } for an authenticated non-admin user", async () => {
    mockGetAuth.mockReturnValue({ userId: "regular-user-id" });
    mockDb.select.mockReturnValue(makeChain([]));
    const res = await request(buildApp()).get("/api/admin/roles/check");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ is_admin: false });
  });

  it("returns { is_admin: true } for an authenticated admin user", async () => {
    mockGetAuth.mockReturnValue({ userId: "admin-user-id" });
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const res = await request(buildApp()).get("/api/admin/roles/check");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ is_admin: true });
  });
});
