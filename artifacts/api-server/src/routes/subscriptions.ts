import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, listingsTable, userSubscriptionsTable } from "@workspace/db";
import { eq, and, ne, count } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

export const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  starter: 5,
  professional: 25,
  premium: 100,
  enterprise: 999999,
};

export const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  premium: "Premium",
  enterprise: "Enterprise",
};

export async function getUserPlan(userId: string): Promise<string> {
  const [row] = await db
    .select({ plan: userSubscriptionsTable.plan })
    .from(userSubscriptionsTable)
    .where(eq(userSubscriptionsTable.user_id, userId))
    .limit(1);
  return row?.plan ?? "free";
}

export async function countActiveListings(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(listingsTable)
    .where(
      and(
        eq(listingsTable.user_id, userId),
        ne(listingsTable.status, "archived")
      )
    );
  return Number(row?.n ?? 0);
}

router.get("/subscriptions/me", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan] ?? 1;
  const activeCount = await countActiveListings(userId);

  res.json({ plan, label: PLAN_LABELS[plan] ?? plan, limit, activeCount });
});

router.put("/subscriptions/:userId", requireAdmin, async (req, res) => {
  const { plan } = req.body as { plan?: string };
  if (!plan || !PLAN_LIMITS[plan]) {
    res.status(400).json({ error: `Invalid plan. Valid plans: ${Object.keys(PLAN_LIMITS).join(", ")}` });
    return;
  }

  const targetUserId = req.params.userId as string;

  await db
    .insert(userSubscriptionsTable)
    .values({ user_id: targetUserId, plan, updated_at: new Date() })
    .onConflictDoUpdate({
      target: userSubscriptionsTable.user_id,
      set: { plan, updated_at: new Date() },
    });

  res.json({ user_id: targetUserId, plan });
});

export default router;
