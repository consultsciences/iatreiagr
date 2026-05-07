const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export type DbListing = {
  id: string;
  slug: string;
  category: "spaces" | "equipment" | "jobs" | "supplies" | "services";
  title: string;
  description: string | null;
  city: string | null;
  region: string | null;
  price: number | null;
  price_unit: string | null;
  price_label: string | null;
  badge: string | null;
  meta: string | null;
  image_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  featured: boolean;
  status: string;
  created_at: string;
};

export const CATEGORY_LABEL: Record<DbListing["category"], string> = {
  spaces: "Ιατρικοί Χώροι",
  equipment: "Εξοπλισμός",
  jobs: "Εργασία",
  supplies: "Αναλώσιμα & Προμηθευτές",
  services: "Υπηρεσίες",
};

export async function fetchListingsByCategory(category: DbListing["category"]) {
  const res = await fetch(`${BASE}/api/listings?category=${category}`);
  if (!res.ok) throw new Error(`Failed to fetch listings: ${res.status}`);
  return res.json() as Promise<DbListing[]>;
}

export async function fetchFeaturedListings(limit = 6) {
  const res = await fetch(`${BASE}/api/listings?featured=true&limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch featured listings: ${res.status}`);
  return res.json() as Promise<DbListing[]>;
}

export async function fetchListingBySlug(slug: string) {
  const res = await fetch(`${BASE}/api/listings/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch listing: ${res.status}`);
  return res.json() as Promise<DbListing>;
}
