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
  user_id: string | null;
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

export async function fetchListingsByQuery(params: { q?: string; city?: string; category?: string; limit?: number }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.city) qs.set("city", params.city);
  if (params.category) qs.set("category", params.category);
  if (params.limit) qs.set("limit", String(params.limit));
  const res = await fetch(`${BASE}/api/listings?${qs.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch listings: ${res.status}`);
  return res.json() as Promise<DbListing[]>;
}

export async function fetchFeaturedListings(limit = 6) {
  const res = await fetch(`${BASE}/api/listings?featured=true&limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch featured listings: ${res.status}`);
  return res.json() as Promise<DbListing[]>;
}

export type ListingCounts = {
  spaces?: number;
  equipment?: number;
  jobs?: number;
  supplies?: number;
  services?: number;
  total?: number;
};

export async function fetchListingCounts(): Promise<ListingCounts> {
  const res = await fetch(`${BASE}/api/listings/counts`);
  if (!res.ok) throw new Error(`Failed to fetch counts: ${res.status}`);
  return res.json() as Promise<ListingCounts>;
}

export async function fetchListingBySlug(slug: string) {
  const res = await fetch(`${BASE}/api/listings/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch listing: ${res.status}`);
  return res.json() as Promise<DbListing>;
}

export async function fetchMyListings(token: string): Promise<DbListing[]> {
  const res = await fetch(`${BASE}/api/listings/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch listings: ${res.status}`);
  return res.json() as Promise<DbListing[]>;
}

export type CreateListingInput = {
  category: DbListing["category"];
  title: string;
  description?: string;
  city?: string;
  region?: string;
  price?: string;
  price_unit?: string;
  price_label?: string;
  image_url?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
};

export async function createListing(input: CreateListingInput, token: string): Promise<DbListing> {
  const res = await fetch(`${BASE}/api/listings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<DbListing>;
}

export async function updateListing(id: string, input: CreateListingInput, token: string): Promise<DbListing> {
  const res = await fetch(`${BASE}/api/listings/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<DbListing>;
}

export async function deleteListing(id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/api/listings/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
}
