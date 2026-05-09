import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { db, listingsTable, userSubscriptionsTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { PlacementOrderBody } from '@workspace/api-zod';
import { getUncachableStripeClient } from '../stripeClient';

const router = Router();

const BASE_URL = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;

const PLACEMENT_PRICE_EUR = 149900; // €1,499.00 in cents

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
}

async function generateUniqueSlug(base: string): Promise<string> {
  const slug = slugify(base) || 'placement';
  for (let i = 0; i < 5; i++) {
    const suffix = Math.random().toString(36).substring(2, 8);
    const candidate = `${slug}-${suffix}`;
    const [existing] = await db
      .select({ id: listingsTable.id })
      .from(listingsTable)
      .where(eq(listingsTable.slug, candidate))
      .limit(1);
    if (!existing) return candidate;
  }
  return `${slug}-${Date.now()}`;
}

async function getOrCreatePlacementPrice(stripe: Awaited<ReturnType<typeof getUncachableStripeClient>>): Promise<string> {
  const prices = await stripe.prices.list({ lookup_keys: ['premium_placement_eur'], limit: 1 });
  if (prices.data[0]) return prices.data[0].id;

  const product = await stripe.products.create({
    name: 'Premium Placement — iatreia.gr',
    description: 'Επαγγελματική καταχώριση υπηρεσίας ή κλινικής στο iatreia.gr',
    metadata: { type: 'placement' },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: PLACEMENT_PRICE_EUR,
    currency: 'eur',
    lookup_key: 'premium_placement_eur',
  });

  return price.id;
}

// POST /api/stripe/placement-checkout
router.post('/stripe/placement-checkout', async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const parsed = PlacementOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  const category = data.placement_type === 'clinic-launch' ? 'services' : 'services';

  try {
    const slug = await generateUniqueSlug(data.title);

    const [listing] = await db
      .insert(listingsTable)
      .values({
        slug,
        category,
        title: data.title,
        description: data.description ?? null,
        proposal: data.proposal ?? null,
        city: data.city ?? null,
        region: data.region ?? null,
        website_url: data.website_url ?? null,
        logo_url: data.logo_url ?? null,
        image_url: data.image_url ?? null,
        contact_name: data.contact_name ?? null,
        contact_email: data.contact_email ?? null,
        contact_phone: data.contact_phone ?? null,
        badge: data.placement_type === 'clinic-launch' ? 'Άνοιγμα Ιατρείου' : 'Premium',
        price_label: '€1.499 / καταχώριση',
        featured: false,
        status: 'pending',
        payment_status: 'pending',
        user_id: userId,
      })
      .returning();

    const stripe = await getUncachableStripeClient();

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

      await db
        .insert(userSubscriptionsTable)
        .values({ user_id: userId, plan: 'free', stripe_customer_id: customerId, updated_at: new Date() })
        .onConflictDoUpdate({
          target: userSubscriptionsTable.user_id,
          set: { stripe_customer_id: customerId, updated_at: new Date() },
        });
    }

    const priceId = await getOrCreatePlacementPrice(stripe);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: `placement_${listing.id}`,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: `${BASE_URL}/listing/${listing.slug}?checkout=success`,
      cancel_url: `${BASE_URL}/advertise?checkout=cancel`,
      metadata: {
        listing_id: listing.id,
        listing_slug: listing.slug,
        placement_type: data.placement_type,
      },
    });

    await db
      .update(listingsTable)
      .set({ payment_session_id: session.id })
      .where(eq(listingsTable.id, listing.id));

    res.json({ url: session.url, listing_id: listing.id, slug: listing.slug });
  } catch (err: any) {
    console.error('[placement/checkout]', err);
    res.status(500).json({ error: err.message ?? 'Failed to create placement checkout' });
  }
});

export default router;
