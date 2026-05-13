import { openai } from "@workspace/integrations-openai-ai-server";
import { db } from "@workspace/db";
import { listingsTable } from "@workspace/db";
import { batchProcess } from "@workspace/integrations-openai-ai-server/batch";
import { logger } from "./logger";

const CATEGORIES = ["spaces", "equipment", "jobs", "supplies", "services"] as const;
type Category = (typeof CATEGORIES)[number];

interface GeneratedListingData {
  category: Category;
  title: string;
  description: string;
  city: string;
  region: string;
  price?: string;
  price_unit?: string;
  price_label?: string;
  contact_name: string;
  contact_email: string;
  image_url?: string;
}

const CITY_REGION: [string, string][] = [
  ["Αθήνα", "Αττική"],
  ["Θεσσαλονίκη", "Κεντρική Μακεδονία"],
  ["Πάτρα", "Δυτική Ελλάδα"],
  ["Ηράκλειο", "Κρήτη"],
  ["Λάρισα", "Θεσσαλία"],
  ["Βόλος", "Θεσσαλία"],
  ["Ιωάννινα", "Ήπειρος"],
  ["Ρόδος", "Νότιο Αιγαίο"],
];

const UNSPLASH_IMAGES: Record<Category, string[]> = {
  spaces: [
    "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80",
    "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&q=80",
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
  ],
  equipment: [
    "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&q=80",
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
    "https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&q=80",
  ],
  jobs: [
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&q=80",
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80",
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80",
  ],
  supplies: [
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
    "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80",
  ],
  services: [
    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
    "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80",
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80",
  ],
};

const CATEGORY_PROMPTS: Record<Category, string> = {
  spaces:
    "a real Greek medical office space, dental clinic, or diagnostic centre for rent or sale",
  equipment:
    "real medical or dental equipment for sale or lease (e.g. ultrasound, dental unit, ECG machine, steriliser, X-ray system)",
  jobs:
    "a real healthcare job opening in Greece (doctor, nurse, dentist, physiotherapist, receptionist, lab technician)",
  supplies:
    "a real medical supplies wholesaler or distributor in Greece (consumables, gloves, syringes, sterilisation materials)",
  services:
    "a real B2B service for healthcare professionals in Greece (legal/licensing, accounting, construction/renovation, leasing, insurance)",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickCategories(count: number): Category[] {
  const result: Category[] = [];
  const shuffled = [...CATEGORIES].sort(() => Math.random() - 0.5);
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length]);
  }
  return result;
}

async function generateSingleListing(category: Category): Promise<GeneratedListingData> {
  const [city, region] = pickRandom(CITY_REGION);
  const prompt = CATEGORY_PROMPTS[category];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You write realistic Greek B2B medical marketplace listings in Greek language.
Output valid JSON with these fields:
- title: string (3-10 words, realistic Greek listing title)
- description: string (60-120 words, professional Greek description with specific details)
- price: string or null (numeric, e.g. "1200" for €1200/month, "25000" for one-time)
- price_unit: string or null ("month", "fixed", "day", or null)
- price_label: string or null (human-readable, e.g. "€1.200/μήνα" or "€25.000")
- contact_name: string (realistic Greek business or person name)
- contact_email: string (realistic Greek email)
Write in Modern Greek. Be specific: include realistic brand names, sizes, certifications.`,
      },
      {
        role: "user",
        content: `Write a listing for ${prompt} in ${city}, ${region}, Greece.`,
      },
    ],
    max_tokens: 400,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const data = JSON.parse(raw) as Partial<GeneratedListingData>;

  return {
    category,
    title: data.title ?? `Αγγελία ${category}`,
    description: data.description ?? "",
    city,
    region,
    price: data.price ?? undefined,
    price_unit: data.price_unit ?? undefined,
    price_label: data.price_label ?? undefined,
    contact_name: data.contact_name ?? "Επικοινωνία",
    contact_email: data.contact_email ?? "info@iatreia.gr",
    image_url: pickRandom(UNSPLASH_IMAGES[category]),
  };
}

export async function generateListings(count: number) {
  const categories = pickCategories(count);

  const results = await batchProcess<Category, GeneratedListingData | null>(
    categories,
    async (category: Category) => {
      try {
        return await generateSingleListing(category);
      } catch (err) {
        logger.error({ err, category }, "listingGenerator: failed to generate listing");
        return null;
      }
    },
    { concurrency: 2, retries: 2 }
  );

  const valid = results.filter((r): r is GeneratedListingData => r !== null);

  const inserted = await Promise.all(
    valid.map(async (data: GeneratedListingData) => {
      const baseSlug = slugify(data.title) || `listing-${Date.now()}`;
      const slug = `${baseSlug}-${Date.now().toString(36)}`;

      try {
        const [row] = await db
          .insert(listingsTable)
          .values({
            slug,
            category: data.category,
            title: data.title,
            description: data.description,
            city: data.city,
            region: data.region,
            price: data.price,
            price_unit: data.price_unit,
            price_label: data.price_label,
            image_url: data.image_url,
            contact_name: data.contact_name,
            contact_email: data.contact_email,
            featured: false,
            status: "published",
            payment_status: "free",
          })
          .returning({ id: listingsTable.id, title: listingsTable.title });
        logger.info({ id: row?.id, title: data.title }, "listingGenerator: inserted");
        return row;
      } catch (err) {
        logger.error({ err, title: data.title }, "listingGenerator: DB insert failed");
        return null;
      }
    })
  );

  return inserted.filter(Boolean);
}
