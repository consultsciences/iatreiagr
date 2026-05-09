import app from "./app";
import { logger } from "./lib/logger";
import { runMigrations } from "stripe-replit-sync";
import { getUncachableStripeClient, getStripeSync } from "./stripeClient";

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.warn("DATABASE_URL not set — skipping Stripe init");
    return;
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    logger.warn("STRIPE_SECRET_KEY not set — skipping Stripe init");
    return;
  }

  try {
    // 1. Create stripe.* schema tables (idempotent)
    logger.info("Initializing Stripe schema...");
    await runMigrations({ databaseUrl });
    logger.info("Stripe schema ready");

    // 2. Ensure webhook exists in Stripe pointing at our endpoint
    const webhookUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}/api/stripe/webhook`;
    const stripe = await getUncachableStripeClient();

    const webhooks = await stripe.webhookEndpoints.list({ limit: 20 });
    const existing = webhooks.data.find((w) => w.url === webhookUrl);

    if (existing) {
      logger.info({ webhookId: existing.id }, "Stripe webhook already registered");
    } else {
      const wh = await stripe.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: [
          "checkout.session.completed",
          "customer.subscription.created",
          "customer.subscription.updated",
          "customer.subscription.deleted",
          "invoice.payment_succeeded",
          "invoice.payment_failed",
        ],
      });
      logger.info({ webhookId: wh.id }, "Stripe webhook registered");

      if (wh.secret && !process.env.STRIPE_WEBHOOK_SECRET) {
        logger.warn(
          { secret: wh.secret },
          "ACTION REQUIRED: Save this webhook secret as STRIPE_WEBHOOK_SECRET in Secrets tab — it will not be shown again"
        );
      }
    }

    // 3. Backfill existing Stripe data into stripe.* tables
    const stripeSync = await getStripeSync();
    stripeSync.syncBackfill().then(() => {
      logger.info("Stripe backfill complete");
    }).catch((err) => {
      logger.error({ err }, "Stripe backfill error (non-fatal)");
    });

  } catch (err) {
    logger.error({ err }, "Failed to initialize Stripe — payments disabled");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

await initStripe();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
