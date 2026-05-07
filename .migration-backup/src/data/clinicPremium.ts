// Premium ranking overrides for clinics in the /clinics directory.
//
// The base clinic dataset (`privateClinics`) is sourced from the public
// Greek Ministry of Health list and is intentionally neutral. This module
// layers a commercial "Premium" tier on top:
//
//   - `premium`  → paid subscription, ranks highest
//   - `featured` → editorially highlighted, ranks above free listings
//   - `verified` → ownership/details verified by our team, small boost
//
// In the future this map can be replaced by a `clinic_subscriptions` table
// in the database without changing the consuming UI.

export type ClinicTier = "premium" | "featured" | "verified" | "free";

export type ClinicPremiumInfo = {
  tier: Exclude<ClinicTier, "free">;
  /** Optional short marketing tagline shown on the card. */
  tagline?: string;
  /** When true, the tier badge is hidden on the card (ranking still applies). */
  badgeHidden?: boolean;
};

// Keyed by `PrivateClinic.id`. Seed defaults — overrides from the admin
// panel are layered on top via localStorage at runtime.
export const CLINIC_PREMIUM_DEFAULTS: Record<number, ClinicPremiumInfo> = {
  2: { tier: "premium", tagline: "24/7 επείγοντα · Συμβεβλημένη με ΕΟΠΥΥ" },
  5: { tier: "premium", tagline: "Πιστοποίηση JCI · Διεθνείς ασθενείς" },
  10: { tier: "featured", tagline: "Νέο τμήμα ρομποτικής χειρουργικής" },
  20: { tier: "featured" },
  35: { tier: "verified" },
  50: { tier: "verified" },
};

const STORAGE_KEY = "clinicPremiumOverrides:v1";

type OverrideEntry = ClinicPremiumInfo | { tier: "free" };

function loadOverrides(): Record<number, OverrideEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

let OVERRIDES: Record<number, OverrideEntry> = loadOverrides();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(OVERRIDES));
  } catch {
    /* ignore quota errors */
  }
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeClinicPremium(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setClinicPremium(id: number, info: ClinicPremiumInfo | null) {
  if (info === null) {
    OVERRIDES[id] = { tier: "free" };
  } else {
    OVERRIDES[id] = info;
  }
  persist();
  emit();
}

export function resetClinicPremium(id: number) {
  delete OVERRIDES[id];
  persist();
  emit();
}

export const CLINIC_PREMIUM = new Proxy({} as Record<number, ClinicPremiumInfo>, {
  get(_t, prop) {
    const id = Number(prop);
    if (!Number.isFinite(id)) return undefined;
    const ov = OVERRIDES[id];
    if (ov) return ov.tier === "free" ? undefined : ov;
    return CLINIC_PREMIUM_DEFAULTS[id];
  },
});

const TIER_RANK: Record<ClinicTier, number> = {
  premium: 0,
  featured: 1,
  verified: 2,
  free: 3,
};

export function getClinicTier(id: number): ClinicTier {
  const ov = OVERRIDES[id];
  if (ov) return ov.tier;
  return CLINIC_PREMIUM_DEFAULTS[id]?.tier ?? "free";
}

export function getClinicPremium(id: number): ClinicPremiumInfo | undefined {
  const ov = OVERRIDES[id];
  if (ov) return ov.tier === "free" ? undefined : ov;
  return CLINIC_PREMIUM_DEFAULTS[id];
}

export function hasOverride(id: number): boolean {
  return id in OVERRIDES;
}

/**
 * Stable comparator: premium → featured → verified → free, then by id
 * so ordering is deterministic across renders.
 */
export function compareClinicsByTier(aId: number, bId: number): number {
  const diff = TIER_RANK[getClinicTier(aId)] - TIER_RANK[getClinicTier(bId)];
  return diff !== 0 ? diff : aId - bId;
}
