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
  const mockGetAuth = vi.fn(() => ({ userId: "test-user-id" }));
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
  doctorAvailabilityTable: {},
  bookingsTable: {},
  clinicClaimsTable: {},
  clinicClaimAuditLogTable: {},
  eq: vi.fn(() => ({})),
  and: vi.fn(() => ({})),
  desc: vi.fn(() => ({})),
  asc: vi.fn(() => ({})),
  count: vi.fn(() => ({})),
  sql: vi.fn(() => ({})),
  gte: vi.fn(() => ({})),
  lte: vi.fn(() => ({})),
  like: vi.fn(() => ({})),
  ilike: vi.fn(() => ({})),
  or: vi.fn(() => ({})),
  isNull: vi.fn(() => ({})),
}));

import doctorsRouter from "./doctors.js";
import bookingsRouter from "./bookings.js";
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
  app.use("/api", doctorsRouter);
  app.use("/api", bookingsRouter);
  app.use("/api", adminRouter);
  return app;
}

const MOCK_DOCTOR_PROFILE = {
  id: "doctor-profile-1",
  user_id: "test-user-id",
  full_name: "Dr. Maria Papadopoulou",
  specialty: "Cardiology",
  city: "Athens",
  email: "dr.maria@clinic.gr",
  phone: null,
  address: null,
  bio: null,
  photo_url: null,
  clinic_id: null,
  subscription_tier: "free",
  is_published: false,
  verified: false,
  verified_at: null,
  onboarding_completed_at: null,
  created_at: new Date().toISOString(),
};

const MOCK_AVAILABILITY_SLOT = {
  id: "slot-1",
  user_id: "test-user-id",
  day_of_week: 1,
  start_time: "09:00",
  end_time: "17:00",
  created_at: new Date().toISOString(),
};

const MOCK_BOOKING = {
  id: "booking-1",
  user_id: null,
  confirmation_code: "ABC123",
  doctor_id: "doctor-user-id",
  doctor_name: "Dr. Nikos Georgiou",
  doctor_specialty: "General Practice",
  doctor_address: null,
  appointment_date: "2026-06-01",
  appointment_slot: "10:00",
  visit_type: "in-person",
  price: "50",
  patient_name: "Giorgos Dimos",
  patient_email: "giorgos@example.com",
  patient_phone: "+306912345678",
  reason: null,
  status: "confirmed",
  cancelled_at: null,
  created_at: new Date().toISOString(),
};

const MOCK_CLINIC_CLAIM = {
  id: "claim-1",
  clinic_id: "clinic-abc",
  user_id: "test-user-id",
  status: "pending",
  decision_note: null,
  created_at: new Date().toISOString(),
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
  mockDb.insert.mockReturnValue(makeChain([MOCK_DOCTOR_PROFILE]));
  mockDb.update.mockReturnValue(makeChain([MOCK_DOCTOR_PROFILE]));
  mockDb.delete.mockReturnValue(makeChain([]));
});

// ---------------------------------------------------------------------------
// PUT /api/doctors/me — upsert own doctor profile
// ---------------------------------------------------------------------------
describe("PUT /api/doctors/me", () => {
  it("returns 401 when not authenticated and never writes to DB", async () => {
    mockGetAuth.mockReturnValue({ userId: null });
    const app = buildApp();
    const res = await request(app)
      .put("/api/doctors/me")
      .send({ full_name: "Dr. Test" });
    expect(res.status).toBe(401);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when full_name is missing and never writes to DB", async () => {
    const app = buildApp();
    const res = await request(app)
      .put("/api/doctors/me")
      .send({ specialty: "Cardiology" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when is_published is not a boolean and never writes to DB", async () => {
    const app = buildApp();
    const res = await request(app)
      .put("/api/doctors/me")
      .send({ full_name: "Dr. Test", is_published: "yes" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 200 with a valid minimal payload (full_name only) and writes to DB once", async () => {
    mockDb.insert.mockReturnValue(makeChain([MOCK_DOCTOR_PROFILE]));
    const app = buildApp();
    const res = await request(app)
      .put("/api/doctors/me")
      .send({ full_name: "Dr. Maria Papadopoulou" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });

  it("returns 200 with a valid full payload and writes to DB once", async () => {
    const updatedProfile = { ...MOCK_DOCTOR_PROFILE, specialty: "Neurology", is_published: true };
    mockDb.insert.mockReturnValue(makeChain([updatedProfile]));
    const app = buildApp();
    const res = await request(app)
      .put("/api/doctors/me")
      .send({
        full_name: "Dr. Maria Papadopoulou",
        specialty: "Neurology",
        city: "Thessaloniki",
        email: "dr.maria@hospital.gr",
        phone: "+302101234567",
        bio: "Experienced neurologist.",
        is_published: true,
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// POST /api/doctors/me/availability — add an availability slot
// ---------------------------------------------------------------------------
describe("POST /api/doctors/me/availability", () => {
  it("returns 401 when not authenticated and never writes to DB", async () => {
    mockGetAuth.mockReturnValue({ userId: null });
    const app = buildApp();
    const res = await request(app)
      .post("/api/doctors/me/availability")
      .send({ day_of_week: 1, start_time: "09:00", end_time: "17:00" });
    expect(res.status).toBe(401);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when day_of_week is missing and never writes to DB", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/doctors/me/availability")
      .send({ start_time: "09:00", end_time: "17:00" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when start_time is missing and never writes to DB", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/doctors/me/availability")
      .send({ day_of_week: 2, end_time: "17:00" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when end_time is missing and never writes to DB", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/doctors/me/availability")
      .send({ day_of_week: 3, start_time: "09:00" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when day_of_week is not a number and never writes to DB", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/doctors/me/availability")
      .send({ day_of_week: "monday", start_time: "09:00", end_time: "17:00" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 201 with a valid payload and writes to DB once", async () => {
    mockDb.insert.mockReturnValue(makeChain([MOCK_AVAILABILITY_SLOT]));
    const app = buildApp();
    const res = await request(app)
      .post("/api/doctors/me/availability")
      .send({ day_of_week: 1, start_time: "09:00", end_time: "17:00" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// POST /api/doctors/me/claims — submit a clinic claim
// ---------------------------------------------------------------------------
describe("POST /api/doctors/me/claims", () => {
  it("returns 401 when not authenticated and never writes to DB", async () => {
    mockGetAuth.mockReturnValue({ userId: null });
    const app = buildApp();
    const res = await request(app)
      .post("/api/doctors/me/claims")
      .send({ clinic_id: "clinic-abc" });
    expect(res.status).toBe(401);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when clinic_id is missing and never writes to DB", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/doctors/me/claims")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 201 with a valid payload and writes to DB once", async () => {
    mockDb.insert.mockReturnValue(makeChain([MOCK_CLINIC_CLAIM]));
    const app = buildApp();
    const res = await request(app)
      .post("/api/doctors/me/claims")
      .send({ clinic_id: "clinic-abc" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// POST /api/bookings — create a booking (public endpoint)
// ---------------------------------------------------------------------------
describe("POST /api/bookings", () => {
  const VALID_BOOKING_PAYLOAD = {
    confirmation_code: "ABC123",
    doctor_id: "doctor-user-id",
    doctor_name: "Dr. Nikos Georgiou",
    doctor_specialty: "General Practice",
    appointment_date: "2026-06-01",
    appointment_slot: "10:00",
    visit_type: "in-person",
    price: 50,
    patient_name: "Giorgos Dimos",
    patient_email: "giorgos@example.com",
    patient_phone: "+306912345678",
  };

  it("returns 400 when doctor_id is missing and never writes to DB", async () => {
    const app = buildApp();
    const { doctor_id: _omit, ...payload } = VALID_BOOKING_PAYLOAD;
    const res = await request(app)
      .post("/api/bookings")
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when patient_email is missing and never writes to DB", async () => {
    const app = buildApp();
    const { patient_email: _omit, ...payload } = VALID_BOOKING_PAYLOAD;
    const res = await request(app)
      .post("/api/bookings")
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when price is a string instead of a number and never writes to DB", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/bookings")
      .send({ ...VALID_BOOKING_PAYLOAD, price: "fifty" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when patient_name is missing and never writes to DB", async () => {
    const app = buildApp();
    const { patient_name: _omit, ...payload } = VALID_BOOKING_PAYLOAD;
    const res = await request(app)
      .post("/api/bookings")
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when confirmation_code is missing and never writes to DB", async () => {
    const app = buildApp();
    const { confirmation_code: _omit, ...payload } = VALID_BOOKING_PAYLOAD;
    const res = await request(app)
      .post("/api/bookings")
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 201 with a valid payload (unauthenticated guest) and writes to DB once", async () => {
    mockGetAuth.mockReturnValue({ userId: null });
    mockDb.insert.mockReturnValue(makeChain([MOCK_BOOKING]));
    const app = buildApp();
    const res = await request(app)
      .post("/api/bookings")
      .send(VALID_BOOKING_PAYLOAD);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });

  it("returns 201 with a valid payload (authenticated user) and writes to DB once", async () => {
    mockDb.insert.mockReturnValue(makeChain([{ ...MOCK_BOOKING, user_id: "test-user-id" }]));
    const app = buildApp();
    const res = await request(app)
      .post("/api/bookings")
      .send(VALID_BOOKING_PAYLOAD);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });

  it("returns 201 with optional fields included and writes to DB once", async () => {
    mockDb.insert.mockReturnValue(makeChain([{ ...MOCK_BOOKING, reason: "Annual check-up" }]));
    const app = buildApp();
    const res = await request(app)
      .post("/api/bookings")
      .send({ ...VALID_BOOKING_PAYLOAD, reason: "Annual check-up", doctor_address: "123 Main St" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/doctors/:id — admin update of a doctor profile
// ---------------------------------------------------------------------------
describe("PATCH /api/admin/doctors/:id", () => {
  it("returns 403 when not authenticated and never writes to DB", async () => {
    mockGetAuth.mockReturnValue({ userId: null });
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/doctors/doctor-profile-1")
      .send({ verified: true });
    expect(res.status).toBe(403);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 403 when the user is not an admin and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/doctors/doctor-profile-1")
      .send({ verified: true });
    expect(res.status).toBe(403);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 400 when verified is a string instead of a boolean and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/doctors/doctor-profile-1")
      .send({ verified: "yes" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the doctor profile does not exist and never writes additional rows", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    mockDb.update.mockReturnValue(makeChain([]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/doctors/nonexistent-doctor")
      .send({ verified: true });
    expect(res.status).toBe(404);
  });

  it("returns 200 when verifying a doctor and writes to DB exactly once", async () => {
    const verifiedDoctor = { ...MOCK_DOCTOR_PROFILE, verified: true, verified_at: new Date().toISOString() };
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    mockDb.update.mockReturnValue(makeChain([verifiedDoctor]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/doctors/doctor-profile-1")
      .send({ verified: true, verified_at: new Date().toISOString() });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });

  it("returns 200 when publishing a doctor profile with an empty body and writes to DB exactly once", async () => {
    const publishedDoctor = { ...MOCK_DOCTOR_PROFILE, is_published: true };
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    mockDb.update.mockReturnValue(makeChain([publishedDoctor]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/doctors/doctor-profile-1")
      .send({ is_published: true });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/claims/:id — admin approve/reject a clinic claim
// ---------------------------------------------------------------------------
describe("PATCH /api/admin/claims/:id", () => {
  it("returns 403 when not authenticated and never writes to DB", async () => {
    mockGetAuth.mockReturnValue({ userId: null });
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/claims/claim-1")
      .send({ status: "approved" });
    expect(res.status).toBe(403);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 403 when the user is not an admin and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/claims/claim-1")
      .send({ status: "approved" });
    expect(res.status).toBe(403);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 400 when status is missing and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/claims/claim-1")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 400 when status is an invalid enum value and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/claims/claim-1")
      .send({ status: "pending" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the claim does not exist or is not pending and never writes additional rows", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    mockDb.update.mockReturnValue(makeChain([]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/claims/nonexistent-claim")
      .send({ status: "approved" });
    expect(res.status).toBe(404);
  });

  it("returns 200 when approving a claim and writes to DB exactly once", async () => {
    const approvedClaim = { ...MOCK_CLINIC_CLAIM, status: "approved" };
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    mockDb.update.mockReturnValue(makeChain([approvedClaim]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/claims/claim-1")
      .send({ status: "approved" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "approved");
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });

  it("returns 200 when rejecting a claim with a note and writes to DB exactly once", async () => {
    const rejectedClaim = { ...MOCK_CLINIC_CLAIM, status: "rejected", decision_note: "Insufficient documentation" };
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    mockDb.update.mockReturnValue(makeChain([rejectedClaim]));
    const app = buildApp();
    const res = await request(app)
      .patch("/api/admin/claims/claim-1")
      .send({ status: "rejected", decision_note: "Insufficient documentation" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "rejected");
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// POST /api/admin/audit-log — admin insert an audit log entry
// ---------------------------------------------------------------------------
describe("POST /api/admin/audit-log", () => {
  it("returns 403 when not authenticated and never writes to DB", async () => {
    mockGetAuth.mockReturnValue({ userId: null });
    const app = buildApp();
    const res = await request(app)
      .post("/api/admin/audit-log")
      .send({ claim_id: "claim-1", decision: "approved" });
    expect(res.status).toBe(403);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 403 when the user is not an admin and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    const app = buildApp();
    const res = await request(app)
      .post("/api/admin/audit-log")
      .send({ claim_id: "claim-1", decision: "approved" });
    expect(res.status).toBe(403);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when claim_id is missing and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const app = buildApp();
    const res = await request(app)
      .post("/api/admin/audit-log")
      .send({ decision: "approved" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when decision is missing and never writes to DB", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    const app = buildApp();
    const res = await request(app)
      .post("/api/admin/audit-log")
      .send({ claim_id: "claim-1" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 201 with a valid minimal payload and writes to DB exactly once", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    mockDb.insert.mockReturnValue(makeChain([]));
    const app = buildApp();
    const res = await request(app)
      .post("/api/admin/audit-log")
      .send({ claim_id: "claim-1", decision: "approved" });
    expect(res.status).toBe(201);
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });

  it("returns 201 with optional fields included and writes to DB exactly once", async () => {
    mockDb.select.mockReturnValue(makeChain([MOCK_ADMIN_ROW]));
    mockDb.insert.mockReturnValue(makeChain([]));
    const app = buildApp();
    const res = await request(app)
      .post("/api/admin/audit-log")
      .send({ claim_id: "claim-1", decision: "failed_email", note: "Email sending failed", error_detail: "SMTP timeout" });
    expect(res.status).toBe(201);
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });
});
