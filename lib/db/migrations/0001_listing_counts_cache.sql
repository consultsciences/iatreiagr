CREATE TABLE "listing_counts_cache" (
  "id" integer PRIMARY KEY NOT NULL,
  "counts" jsonb NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
