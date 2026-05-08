const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export type PlanName = "free" | "starter" | "professional" | "premium" | "enterprise";

export type SubscriptionStatus = {
  plan: PlanName;
  label: string;
  limit: number;
  activeCount: number;
};

export async function fetchSubscriptionStatus(token: string): Promise<SubscriptionStatus> {
  const res = await fetch(`${BASE}/api/subscriptions/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch subscription: ${res.status}`);
  return res.json() as Promise<SubscriptionStatus>;
}

export const PLAN_UPGRADE_ORDER: PlanName[] = [
  "free",
  "starter",
  "professional",
  "premium",
  "enterprise",
];

export const PLAN_COLORS: Record<PlanName, string> = {
  free: "bg-slate-100 text-slate-700 border-slate-200",
  starter: "bg-blue-100 text-blue-700 border-blue-200",
  professional: "bg-amber-100 text-amber-700 border-amber-200",
  premium: "bg-purple-100 text-purple-700 border-purple-200",
  enterprise: "bg-emerald-100 text-emerald-700 border-emerald-200",
};
