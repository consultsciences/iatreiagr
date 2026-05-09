/**
 * Seed Stripe products and prices for iatreia.gr subscription plans.
 * Run with: pnpm --filter @workspace/api-server exec tsx src/seed-products.ts
 *
 * Products are created idempotently (safe to run multiple times).
 * Currency: EUR. Prices are in euro cents.
 */

import { getUncachableStripeClient } from './stripeClient';

const PLANS = [
  {
    plan: 'starter',
    name: 'Starter',
    description: 'Για ιατρεία και μικρούς καταχωρητές. Έως 5 ενεργές αγγελίες.',
    monthlyAmountCents: 2900, // €29.00
  },
  {
    plan: 'professional',
    name: 'Professional',
    description: 'Για μεσίτες, διανομείς και εταιρείες. Έως 25 ενεργές αγγελίες.',
    monthlyAmountCents: 8900, // €89.00
  },
  {
    plan: 'premium',
    name: 'Premium',
    description: 'Για προμηθευτές και μεγάλες κλινικές. Έως 100 ενεργές αγγελίες.',
    monthlyAmountCents: 24900, // €249.00
  },
];

async function seed() {
  const stripe = await getUncachableStripeClient();

  for (const p of PLANS) {
    console.log(`\nProcessing plan: ${p.name}`);

    // Check if product already exists
    const existing = await stripe.products.search({
      query: `metadata['plan']:'${p.plan}' AND active:'true'`,
    });

    let productId: string;

    if (existing.data.length > 0) {
      productId = existing.data[0].id;
      console.log(`  ✓ Product already exists: ${productId}`);
    } else {
      const product = await stripe.products.create({
        name: p.name,
        description: p.description,
        metadata: { plan: p.plan },
      });
      productId = product.id;
      console.log(`  ✓ Created product: ${productId}`);
    }

    // Check if monthly price already exists
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
    });

    const monthlyExists = prices.data.some(
      (pr) => pr.recurring?.interval === 'month' && pr.currency === 'eur'
    );

    if (monthlyExists) {
      console.log(`  ✓ Monthly EUR price already exists`);
    } else {
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: p.monthlyAmountCents,
        currency: 'eur',
        recurring: { interval: 'month' },
      });
      console.log(`  ✓ Created monthly price: ${price.id} (€${p.monthlyAmountCents / 100}/month)`);
    }
  }

  console.log('\n✓ Seeding complete. Webhooks will sync products to the database automatically.');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
