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
  const mockGetAuth = vi.fn<() => { userId: string | null | undefined }>(() => ({ userId: "test-user-id" }));
  return { mockGetAuth, mockDb };
});

vi.mock("@clerk/express", () => ({
  getAuth: mockGetAuth,
  clerkMiddleware: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
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

import listingsRouter from "./listings.js";
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

const MOCK_LISTING = {
  id: "listing-123",
  user_id: "test-user-id",
  status: "pending",
  title: "Test Listing",
  category: "spaces",
  slug: "test-listing-abc123",
  featured: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  description: null,
  city: null,
  region: null,
  price: null,
  price_unit: null,
  price_label: null,
  image_url: null,
  contact_name: null,
  contact_email: null,
  contact_phone: null,
};

const MOCK_ADMIN_ROW = {
  id: "role-1",
  user_id: "test-user-id",
  role: "admin",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAuth.mockReturnValue({ userId: "test-user-id" });
  mockDb.select.mockReturnValue(makeChain([]));
  mockDb.insert.mockReturnValue(makeChain([MOCK_LISTING]));
  mockDb.update.mockReturnValue(makeChain([MOCK_LISTING]));
  mockDb.delete.mockReturnValue(makeChain([]));
});

// ---------------------------------------------------------------------------
// POST /api/listings
// ---------------------------------------------------------------------------
describe("POST /api/listings", () => {
  it("returns 401 when not authenticated and never writes to DB", async () => {
    mockGetAuth.mockReturnValue({ userId: null });
    const app = buildApp();
    const res = await request(app)
      .post("/api/listings")
      .send({ category: "spaces", title: "My Clinic Space" });
    expect(res.status).toBe(401);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when category is missing and never writes to DB", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/listings")
      .send({ title: "My Clinic Space" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when title is missing and never writes to DB", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/listings")
      .send({ category: "spaces" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when category is not a valid enum value and never writes to DB", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/listings")
      .send({ category: "invalid-category", title: "My Clinic Space" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when title is too short (fewer than 3 characters) and never writes to DB", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/listings")
      .send({ category: "equipment", title: "ab" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when title is too long (more than 200 characters) and never writes to DB", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/listings")
      .send({ category: "jobs", title: "a".repeat(201) });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when contact_email is malformed and never writes to DB", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/listings")
      .send({ category: "services", title: "Nurse Available", contact_email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when image_url is not a valid http/https URL and never writes to DB", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/listings")
      .send({ category: "supplies", title: "Medical Supplies", image_url: "ftp://bad.url/img.png" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when price is negative and never writes to DB", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/listings")
      .send({ category: "spaces", title: "Clinic Room", price: -50 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 201 with a valid minimal payload and writes to DB exactly once", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    mockDb.insert.mockReturnValue(makeChain([MOCK_LISTING]));
    const app = buildApp();
    const res = await request(app)
      .post("/api/listings")
      .send({ category: "spaces", title: "Clinic Room Available" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });

  it("returns 201 with a valid full payload and writes to DB exactly once", async () => {
    const fullListing = {
      ...MOCK_LISTING,
      category: "equipment",
      title: "MRI Machine For Sale",
      contact_email: "seller@clinic.gr",
      image_url: "https://example.com/mri.jpg",
      price: "15000",
    };
    mockDb.select.mockReturnValue(makeChain([]));
    mockDb.insert.mockReturnValue(makeChain([fullListing]));
    const app = buildApp();
    const res = await request(app)
      .post("/api/listings")
      .send({
        category: "equipment",
        title: "MRI Machine For Sale",
        contact_email: "seller@clinic.gr",
        image_url: "https://example.com/mri.jpg",
        price: 15000,
        city: "Athens",
        region: "Attica",
        description: "Excellent condition, barely used.",
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });

  it("returns 201 when all optional fields are omitted and writes to DB exactly once", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    mockDb.insert.mockReturnValue(makeChain([MOCK_LISTING]));
    const app = buildApp();
    const res = await request(app)
      .post("/api/listings")
      .send({ category: "jobs", title: "Receptionist Needed" });
    expect(res.status).toBe(201);
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/listings/:id
// ---------------------------------------------------------------------------
describe("PUT /api/listings/:id", () => {
  it("returns 401 when not authenticated and never writes to DB", async () => {
    mockGetAuth.mockReturnValue({ userId: null });
    const app = buildApp();
    const res = await request(app)
      .put("/api/listings/listing-123")
      .send({ category: "spaces", title: "Updated Title" });
    expect(res.status).toBe(401);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the listing does not exist and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    const app = buildApp();
    const res = await request(app)
      .put("/api/listings/nonexistent-id")
      .send({ category: "spaces", title: "Updated Title" });
    expect(res.status).toBe(404);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 403 when the listing belongs to another user and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([{ ...MOCK_LISTING, user_id: "other-user-id" }]));
    const app = buildApp();
    const res = await request(app)
      .put("/api/listings/listing-123")
      .send({ category: "spaces", title: "Updated Title" });
    expect(res.status).toBe(403);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 409 when the listing is already published and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([{ ...MOCK_LISTING, status: "published" }]));
    const app = buildApp();
    const res = await request(app)
      .put("/api/listings/listing-123")
      .send({ category: "spaces", title: "Updated Title" });
    expect(res.status).toBe(409);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 400 when category is missing and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_LISTING]));
    const app = buildApp();
    const res = await request(app)
      .put("/api/listings/listing-123")
      .send({ title: "Updated Title" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 400 when category is invalid and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_LISTING]));
    const app = buildApp();
    const res = await request(app)
      .put("/api/listings/listing-123")
      .send({ category: "nonexistent", title: "Updated Title" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 400 when title is missing and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_LISTING]));
    const app = buildApp();
    const res = await request(app)
      .put("/api/listings/listing-123")
      .send({ category: "spaces" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 400 when contact_email is malformed and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_LISTING]));
    const app = buildApp();
    const res = await request(app)
      .put("/api/listings/listing-123")
      .send({ category: "spaces", title: "Clinic Room", contact_email: "bad@@email" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 400 when image_url uses an unsupported protocol and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_LISTING]));
    const app = buildApp();
    const res = await request(app)
      .put("/api/listings/listing-123")
      .send({ category: "spaces", title: "Clinic Room", image_url: "data:image/png;base64,abc" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 200 with a valid payload and writes to DB exactly once", async () => {
    const updatedListing = { ...MOCK_LISTING, title: "Updated Clinic Room", status: "pending" };
    mockDb.select.mockReturnValue(makeChain([MOCK_LISTING]));
    mockDb.update.mockReturnValue(makeChain([updatedListing]));
    const app = buildApp();
    const res = await request(app)
      .put("/api/listings/listing-123")
      .send({ category: "spaces", title: "Updated Clinic Room" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });

  it("returns 200 with all optional fields present and valid and writes to DB exactly once", async () => {
    const updatedListing = {
      ...MOCK_LISTING,
      title: "Updated MRI Machine",
      category: "equipment",
      contact_email: "owner@clinic.gr",
      image_url: "https://cdn.example.com/photo.jpg",
    };
    mockDb.select.mockReturnValue(makeChain([MOCK_LISTING]));
    mockDb.update.mockReturnValue(makeChain([updatedListing]));
    const app = buildApp();
    const res = await request(app)
      .put("/api/listings/listing-123")
      .send({
        category: "equipment",
        title: "Updated MRI Machine",
        contact_email: "owner@clinic.gr",
        image_url: "https://cdn.example.com/photo.jpg",
        price: 20000,
        city: "Thessaloniki",
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/listings/:id
// ---------------------------------------------------------------------------
describe("DELETE /api/listings/:id", () => {
  it("returns 401 when not authenticated and never deletes from DB", async () => {
    mockGetAuth.mockReturnValue({ userId: null });
    const app = buildApp();
    const res = await request(app).delete("/api/listings/listing-123");
    expect(res.status).toBe(401);
    expect(mockDb.delete).not.toHaveBeenCalled();
  });

  it("returns 404 when the listing does not exist and never deletes from DB", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    const app = buildApp();
    const res = await request(app).delete("/api/listings/nonexistent-id");
    expect(res.status).toBe(404);
    expect(mockDb.delete).not.toHaveBeenCalled();
  });

  it("returns 403 when the listing belongs to another user and never deletes from DB", async () => {
    mockDb.select.mockReturnValue(makeChain([{ ...MOCK_LISTING, user_id: "other-user-id" }]));
    const app = buildApp();
    const res = await request(app).delete("/api/listings/listing-123");
    expect(res.status).toBe(403);
    expect(mockDb.delete).not.toHaveBeenCalled();
  });

  it("returns 204 when the authenticated user deletes their own non-published listing", async () => {
    mockDb.select.mockReturnValue(makeChain([{ ...MOCK_LISTING, status: "pending" }]));
    mockDb.delete.mockReturnValue(makeChain([]));
    const app = buildApp();
    const res = await request(app).delete("/api/listings/listing-123");
    expect(res.status).toBe(204);
    expect(mockDb.delete).toHaveBeenCalledTimes(1);
  });

  it("returns 204 when the authenticated user deletes their own published listing and invalidates the counts cache", async () => {
    mockDb.select.mockReturnValue(makeChain([{ ...MOCK_LISTING, status: "published" }]));
    mockDb.delete.mockReturnValue(makeChain([]));
    const app = buildApp();
    const res = await request(app).delete("/api/listings/listing-123");
    expect(res.status).toBe(204);
    expect(mockDb.delete).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/listings/:id
// ---------------------------------------------------------------------------
describe("PATCH /api/admin/listings/:id", () => {
  it("returns 401 when not authenticated and never writes to DB", async () => {
    mockGetAuth.mockReturnValue({ userId: null });
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/listings/listing-123")
      .send({ status: "published" });
    expect(res.status).toBe(401);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 403 when the user is not an admin and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/listings/listing-123")
      .send({ status: "published" });
    expect(res.status).toBe(403);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 400 when status field is missing and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/listings/listing-123")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 400 when status is not a valid enum value and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/listings/listing-123")
      .send({ status: "approved" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 400 when status is an empty string and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/listings/listing-123")
      .send({ status: "" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the listing does not exist and never writes additional rows", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    mockDb.update.mockReturnValue(makeChain([]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/listings/nonexistent-id")
      .send({ status: "published" });
    expect(res.status).toBe(404);
  });

  it("returns 200 when publishing a listing and writes to DB exactly once", async () => {
    const publishedListing = { ...MOCK_LISTING, status: "published" };
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    mockDb.update.mockReturnValue(makeChain([publishedListing]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/listings/listing-123")
      .send({ status: "published" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "published");
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });

  it("returns 200 when archiving a listing and writes to DB exactly once", async () => {
    const archivedListing = { ...MOCK_LISTING, status: "archived" };
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    mockDb.update.mockReturnValue(makeChain([archivedListing]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/listings/listing-123")
      .send({ status: "archived" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "archived");
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });

  it("returns 200 when setting a listing back to draft and writes to DB exactly once", async () => {
    const draftListing = { ...MOCK_LISTING, status: "draft" };
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    mockDb.update.mockReturnValue(makeChain([draftListing]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/listings/listing-123")
      .send({ status: "draft" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "draft");
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });
});
