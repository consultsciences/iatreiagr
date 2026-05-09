import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { db, userSubscriptionsTable } from '@workspace/db';
import { eq, sql } from 'drizzle-orm';
import { getUncachableStripeClient } from '../stripeClient';

const router = Router();

const BASE_URL = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;

// POST /api/stripe/checkout  { plan: "starter" | "professional" | "premium" }
router.post('/stripe/checkout', async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { plan } = req.body as { plan?: string };
  const validPlans = ['starter', 'professional', 'premium'];
  if (!plan || !validPlans.includes(plan)) {
    res.status(400).json({ error: `Invalid plan. Choose: ${validPlans.join(', ')}` });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();

    // Look up the Stripe product by metadata.plan
    const productsResult = await db.execute(
      sql`SELECT id FROM stripe.products WHERE active = true AND metadata->>'plan' = ${plan} LIMIT 1`
    );
    const productRow = productsResult.rows[0] as { id: string } | undefined;

    if (!productRow) {
      res.status(404).json({ error: `No Stripe product found for plan "${plan}". Run the seed script first.` });
      return;
    }

    // Get the monthly price for this product
    const pricesResult = await db.execute(
      sql`SELECT id FROM stripe.prices WHERE product = ${productRow.id} AND active = true AND (recurring->>'interval') = 'month' LIMIT 1`
    );
    const priceRow = pricesResult.rows[0] as { id: string } | undefined;

    if (!priceRow) {
      res.status(404).json({ error: `No monthly price found for plan "${plan}".` });
      return;
    }

    // Get or create Stripe customer
    const [subRow] = await db
      .select({ stripe_customer_id: userSubscriptionsTable.stripe_customer_id })
      .from(userSubscriptionsTable)
      .where(eq(userSubscriptionsTable.user_id, userId))
      .limit(1);

    let customerId = subRow?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { clerk_user_id: userId },
      });
      customerId = customer.id;

      // Persist customer ID immediately
      await db
        .insert(userSubscriptionsTable)
        .values({ user_id: userId, plan: 'free', stripe_customer_id: customerId, updated_at: new Date() })
        .onConflictDoUpdate({
          target: userSubscriptionsTable.user_id,
          set: { stripe_customer_id: customerId, updated_at: new Date() },
        });
    }

    // Create Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: userId,
      payment_method_types: ['card'],
      line_items: [{ price: priceRow.id, quantity: 1 }],
      mode: 'subscription',
      success_url: `${BASE_URL}/pricing?checkout=success`,
      cancel_url: `${BASE_URL}/pricing?checkout=cancel`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('[stripe/checkout]', err);
    res.status(500).json({ error: err.message ?? 'Failed to create checkout session' });
  }
});

// POST /api/stripe/portal  — customer billing portal
router.post('/stripe/portal', async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    const [row] = await db
      .select({ stripe_customer_id: userSubscriptionsTable.stripe_customer_id })
      .from(userSubscriptionsTable)
      .where(eq(userSubscriptionsTable.user_id, userId))
      .limit(1);

    if (!row?.stripe_customer_id) {
      res.status(404).json({ error: 'No Stripe customer found for this user.' });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: `${BASE_URL}/pricing`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('[stripe/portal]', err);
    res.status(500).json({ error: err.message ?? 'Failed to create portal session' });
  }
});

export default router;
