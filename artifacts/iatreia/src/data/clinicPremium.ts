// Premium ranking for clinics in the /clinics directory.
//
// Tiers:
//   - `premium`  → paid subscription, ranks highest
//   - `featured` → editorially highlighted
//   - `verified` → ownership verified, small boost
//
// Settings are fetched from the DB via /api/clinics/settings and merged
// with CLINIC_PREMIUM_DEFAULTS at startup. Admins update via /api/admin/clinics/settings/:id.

import { getApiBase } from "@/lib/apiBase";

export type ClinicTier = "premium" | "featured" | "verified" | "free";

export type ClinicPremiumInfo = {
  tier: Exclude<ClinicTier, "free">;
  tagline?: string;
  badgeHidden?: boolean;
};

// Compile-time defaults — shown before the API responds and as fallback.
export const CLINIC_PREMIUM_DEFAULTS: Record<number, ClinicPremiumInfo> = {
  2: { tier: "premium", tagline: "24/7 επείγοντα · Συμβεβλημένη με ΕΟΠΥΥ" },
  5: { tier: "premium", tagline: "Πιστοποίηση JCI · Διεθνείς ασθενείς" },
  10: { tier: "featured", tagline: "Νέο τμήμα ρομποτικής χειρουργικής" },
  20: { tier: "featured" },
  35: { tier: "verified" },
  50: { tier: "verified" },
};

// Runtime state — starts from defaults, overwritten by DB fetch.
let SETTINGS: Record<number, ClinicPremiumInfo | null> = {};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeClinicPremium(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Called once at app startup (App.tsx).
export async function initClinicPremium(): Promise<void> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/api/clinics/settings`);
    if (!res.ok) return;
    const data = (await res.json()) as {
      settings: { clinic_id: number; tier: string; tagline?: string | null; badge_hidden?: boolean }[];
    };
    const next: Record<number, ClinicPremiumInfo | null> = {};
    for (const s of data.settings) {
      if (s.tier === "premium" || s.tier === "featured" || s.tier === "verified") {
        next[s.clinic_id] = {
          tier: s.tier,
          tagline: s.tagline ?? undefined,
          badgeHidden: s.badge_hidden ?? false,
        };
      } else {
        next[s.clinic_id] = null;
      }
    }
    SETTINGS = next;
    emit();
  } catch {
    // Non-fatal: fall back to compile-time defaults
  }
}

function resolve(id: number): ClinicPremiumInfo | undefined {
  if (id in SETTINGS) {
    const s = SETTINGS[id];
    return s ?? undefined;
  }
  return CLINIC_PREMIUM_DEFAULTS[id];
}

export async function setClinicPremium(
  id: number,
  info: ClinicPremiumInfo | null,
  token: string
): Promise<void> {
  const base = getApiBase();
  if (info === null) {
    await fetch(`${base}/api/admin/clinics/settings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    SETTINGS[id] = null;
  } else {
    await fetch(`${base}/api/admin/clinics/settings/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tier: info.tier,
        tagline: info.tagline,
        badge_hidden: info.badgeHidden ?? false,
      }),
    });
    SETTINGS[id] = info;
  }
  emit();
}

export async function resetClinicPremium(id: number, token: string): Promise<void> {
  const base = getApiBase();
  await fetch(`${base}/api/admin/clinics/settings/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  delete SETTINGS[id];
  emit();
}

export const CLINIC_PREMIUM = new Proxy({} as Record<number, ClinicPremiumInfo>, {
  get(_t, prop) {
    const id = Number(prop);
    if (!Number.isFinite(id)) return undefined;
    return resolve(id);
  },
});

const TIER_RANK: Record<ClinicTier, number> = {
  premium: 0,
  featured: 1,
  verified: 2,
  free: 3,
};

export function getClinicTier(id: number): ClinicTier {
  return resolve(id)?.tier ?? "free";
}

export function getClinicPremium(id: number): ClinicPremiumInfo | undefined {
  return resolve(id);
}

export function hasOverride(id: number): boolean {
  return id in SETTINGS;
}

export function compareClinicsByTier(aId: number, bId: number): number {
  const diff = TIER_RANK[getClinicTier(aId)] - TIER_RANK[getClinicTier(bId)];
  return diff !== 0 ? diff : aId - bId;
}
