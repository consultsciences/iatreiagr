import Stripe from 'stripe';
import { StripeSync } from 'stripe-replit-sync';

function getStripeCredentials(): { secretKey: string; webhookSecret?: string } {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY environment variable is not set. ' +
      'Add your Stripe live secret key (sk_live_...) to the Secrets tab.'
    );
  }
  return {
    secretKey,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = getStripeCredentials();
  return new Stripe(secretKey);
}

export async function getStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const { secretKey, webhookSecret } = getStripeCredentials();
  return new StripeSync({
    poolConfig: { connectionString: databaseUrl },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: webhookSecret ?? '',
  });
}

export async function constructWebhookEvent(
  payload: Buffer,
  sig: string,
): Promise<Stripe.Event> {
  const { secretKey, webhookSecret } = getStripeCredentials();
  if (!webhookSecret) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET is not set. ' +
      'Add your Stripe webhook signing secret to the Secrets tab.'
    );
  }
  const stripe = new Stripe(secretKey);
  return stripe.webhooks.constructEventAsync(payload, sig, webhookSecret);
}
