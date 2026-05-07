import { supabase } from "@/integrations/supabase/client";

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
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("category", category)
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbListing[];
}

export async function fetchFeaturedListings(limit = 6) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DbListing[];
}

export async function fetchListingBySlug(slug: string) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as DbListing | null;
}
