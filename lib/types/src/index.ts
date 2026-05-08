export interface DoctorProfile {
  id: string;
  user_id: string;
  full_name: string;
  specialty: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  bio: string | null;
  photo_url: string | null;
  clinic_id: string | null;
  subscription_tier: string;
  is_published: boolean;
  verified: boolean;
  /** ISO string on the wire; Drizzle returns Date before serialization. */
  verified_at: Date | string | null;
  /** ISO string on the wire; Drizzle returns Date before serialization. */
  onboarding_completed_at: Date | string | null;
  /** ISO string on the wire; Drizzle returns Date before serialization. */
  created_at: Date | string;
}

export type DoctorProfileForm = Pick<
  DoctorProfile,
  | "full_name"
  | "specialty"
  | "bio"
  | "photo_url"
  | "address"
  | "city"
  | "phone"
  | "email"
  | "clinic_id"
  | "is_published"
>;

export interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface DoctorBooking {
  id: string;
  patient_name: string;
  appointment_date: string;
  appointment_slot: string;
  visit_type: string;
  status: string;
  reason?: string | null;
}

/** Canonical booking record as sent over the wire (patient-facing view). */
export interface PatientBooking {
  id: string;
  confirmation_code: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialty: string;
  doctor_address: string | null;
  appointment_date: string;
  appointment_slot: string;
  /** "in-person" | "telehealth" — kept as string because Drizzle text columns return string. */
  visit_type: string;
  /** Drizzle numeric columns serialize to string via JSON; consumers should coerce as needed. */
  price: number | string;
  reason: string | null;
  /** ISO string on the wire; Drizzle returns Date before serialization. */
  created_at: Date | string;
  status: string;
  /** ISO string on the wire; Drizzle returns Date before serialization. */
  cancelled_at: Date | string | null;
}

/** Alias for the canonical booking record consumed by most callers. */
export type Booking = PatientBooking;

export interface ClinicClaim {
  id: string;
  clinic_id: string;
  user_id: string;
  status: string;
  /** ISO string on the wire; Drizzle returns Date before serialization. */
  created_at: Date | string;
  decision_note: string | null;
}

export interface ClinicClaimRecord {
  id: string;
  clinic_id: string;
  status: string;
}

export interface AuditLogEntry {
  id: string;
  claim_id: string;
  admin_id: string;
  decision: string;
  note: string | null;
  error_detail: string | null;
  /** ISO string on the wire; Drizzle returns Date before serialization. */
  created_at: Date | string;
}
