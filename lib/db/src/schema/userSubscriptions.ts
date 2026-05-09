import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const userSubscriptionsTable = pgTable("user_subscriptions", {
  user_id: text("user_id").primaryKey(),
  plan: text("plan").notNull().default("free"),
  stripe_customer_id: text("stripe_customer_id"),
  stripe_subscription_id: text("stripe_subscription_id"),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type UserSubscription = typeof userSubscriptionsTable.$inferSelect;
