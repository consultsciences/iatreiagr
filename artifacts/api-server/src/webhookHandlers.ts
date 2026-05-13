import type Stripe from 'stripe';
import { getStripeSync, constructWebhookEvent, getUncachableStripeClient } from './stripeClient';
import { db, userSubscriptionsTable, listingsTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { notifySellerOfListingStatusChange } from './lib/listingEmail';

const VALID_PLANS = new Set(['free', 'starter', 'professional', 'premium', 'enterprise']);

async function syncSubscriptionToUser(
  clerkUserId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  plan: string,
): Promise<void> {
  const resolvedPlan = VALID_PLANS.has(plan) ? plan : 'free';
  await db
    .insert(userSubscriptionsTable)
    .values({
      user_id: clerkUserId,
      plan: resolvedPlan,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      updated_at: new Date(),
    })
    .onConflictDoUpdate({
      target: userSubscriptionsTable.user_id,
      set: {
        plan: resolvedPlan,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        updated_at: new Date(),
      },
    });
}

async function getClerkUserIdByCustomer(stripeCustomerId: string): Promise<string | null> {
  const [row] = await db
    .select({ user_id: userSubscriptionsTable.user_id })
    .from(userSubscriptionsTable)
    .where(eq(userSubscriptionsTable.stripe_customer_id, stripeCustomerId))
    .limit(1);
  return row?.user_id ?? null;
}

async function getPlanFromSubscription(
  stripe: Stripe,
  subscriptionId: string,
): Promise<string> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product'],
  });
  const price = sub.items.data[0]?.price as Stripe.Price & { product: Stripe.Product };
  return (price?.product as Stripe.Product)?.metadata?.plan ?? 'free';
}

async function publishPlacementListing(listingId: string): Promise<void> {
  const [row] = await db
    .select({ user_id: listingsTable.user_id, title: listingsTable.title })
    .from(listingsTable)
    .where(eq(listingsTable.id, listingId))
    .limit(1);

  await db
    .update(listingsTable)
    .set({ status: 'published', payment_status: 'paid', featured: true })
    .where(eq(listingsTable.id, listingId));

  console.log(`[webhook] Placement listing published: ${listingId}`);

  if (row?.user_id) {
    notifySellerOfListingStatusChange(row.user_id, row.title, 'published').catch((err) =>
      console.error('[webhook] Failed to send placement email:', err),
    );
  }
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).',
      );
    }

    // Parse event for custom user_subscriptions sync
    let event: Stripe.Event;
    try {
      event = await constructWebhookEvent(payload, signature);
    } catch {
      // If we can't parse (e.g., webhook secret not yet configured), still process for stripe schema
      const sync = await getStripeSync();
      await sync.processWebhook(payload, signature);
      return;
    }

    // Sync stripe.* schema tables via stripe-replit-sync
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // Handle our custom user_subscriptions sync
    const stripe = await getUncachableStripeClient();

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkUserId = session.client_reference_id;
        const customerId = session.customer as string;

        // One-time placement payment
        if (session.mode === 'payment' && clerkUserId?.startsWith('placement_')) {
          const listingId = clerkUserId.replace('placement_', '');
          await publishPlacementListing(listingId);
          return;
        }

        // Also check metadata for listing_id (belt-and-suspenders)
        const listingIdFromMeta = (session.metadata as Record<string, string> | null)?.listing_id;
        if (session.mode === 'payment' && listingIdFromMeta) {
          await publishPlacementListing(listingIdFromMeta);
          return;
        }

        // Subscription checkout
        const subscriptionId = session.subscription as string;
        if (!clerkUserId || !subscriptionId) return;

        const plan = await getPlanFromSubscription(stripe, subscriptionId);
        await syncSubscriptionToUser(clerkUserId, customerId, subscriptionId, plan);

      } else if (event.type === 'customer.subscription.updated') {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const clerkUserId = await getClerkUserIdByCustomer(customerId);
        if (!clerkUserId) return;

        const plan = await getPlanFromSubscription(stripe, sub.id);
        const status = sub.status;
        const resolvedPlan = (status === 'active' || status === 'trialing') ? plan : 'free';
        await syncSubscriptionToUser(clerkUserId, customerId, sub.id, resolvedPlan);

      } else if (event.type === 'customer.subscription.deleted') {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const clerkUserId = await getClerkUserIdByCustomer(customerId);
        if (!clerkUserId) return;

        await db
          .insert(userSubscriptionsTable)
          .values({
            user_id: clerkUserId,
            plan: 'free',
            stripe_customer_id: customerId,
            stripe_subscription_id: null,
            updated_at: new Date(),
          })
          .onConflictDoUpdate({
            target: userSubscriptionsTable.user_id,
            set: { plan: 'free', stripe_subscription_id: null, updated_at: new Date() },
          });
      }
    } catch (err) {
      console.error('[webhook] Error syncing user subscription:', err);
    }
  }
}
