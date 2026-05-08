import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

const { mockGetAuth, mockDb } = vi.hoisted(() => {
  const mockDb = {
    select: vi.fn(),
  };
  const mockGetAuth = vi.fn(() => ({ userId: "admin-user-id" }));
  return { mockGetAuth, mockDb };
});

vi.mock("@clerk/express", () => ({
  getAuth: mockGetAuth,
}));

vi.mock("@workspace/db", () => ({
  db: mockDb,
  userRolesTable: {},
  eq: vi.fn(() => ({})),
  and: vi.fn(() => ({})),
}));

import { requireAdmin } from "./requireAdmin.js";

const MOCK_ADMIN_ROW = {
  id: "role-1",
  user_id: "admin-user-id",
  role: "admin",
};

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

function makeMocks() {
  const req = {} as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAuth.mockReturnValue({ userId: "admin-user-id" });
  mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
});

describe("requireAdmin middleware", () => {
  it("returns 401 when userId is missing", async () => {
    mockGetAuth.mockReturnValue({ userId: null });
    const { req, res, next } = makeMocks();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when userId is undefined", async () => {
    mockGetAuth.mockReturnValue({ userId: undefined });
    const { req, res, next } = makeMocks();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when the user has no admin role in the database", async () => {
    mockGetAuth.mockReturnValue({ userId: "non-admin-id" });
    mockDb.select.mockReturnValue(makeChain([]));
    const { req, res, next } = makeMocks();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when the user has an admin role in the database", async () => {
    mockGetAuth.mockReturnValue({ userId: "admin-user-id" });
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const { req, res, next } = makeMocks();

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
