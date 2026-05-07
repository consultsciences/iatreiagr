import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const img = (q: string) =>
  `https://images.unsplash.com/${q}?w=800&h=560&fit=crop&auto=format&q=70`;

async function seedListings() {
  console.log("Seeding listings…");

  const listings: schema.InsertListing[] = [
    {
      slug: "sp-001",
      category: "spaces",
      title: "Ιατρείο 95τ.μ. προς ενοικίαση — Κολωνάκι",
      city: "Αθήνα",
      region: "Αττική",
      price: "1450",
      price_unit: "month",
      price_label: "€1.450 / μήνα",
      badge: "Ενοικίαση",
      meta: "3 χώροι · Ρεσεψιόν · Ανακαινισμένο",
      image_url: img("photo-1497366216548-37526070297c"),
      status: "published",
      featured: true,
    },
    {
      slug: "sp-002",
      category: "spaces",
      title: "Οδοντιατρείο πλήρως εξοπλισμένο — Γλυφάδα",
      city: "Αθήνα",
      region: "Αττική",
      price: "185000",
      price_unit: "total",
      price_label: "€185.000",
      badge: "Πώληση",
      meta: "70τ.μ. · 2 έδρες · Ισόγειο",
      image_url: img("photo-1629909613654-28e377c37b09"),
      status: "published",
      featured: true,
    },
    {
      slug: "sp-003",
      category: "spaces",
      title: "Διαγνωστικό κέντρο 220τ.μ. — Καλαμαριά",
      city: "Θεσσαλονίκη",
      region: "Κεντρική Μακεδονία",
      price: "2800",
      price_unit: "month",
      price_label: "€2.800 / μήνα",
      badge: "Ενοικίαση",
      meta: "Έτοιμο για άδεια λειτουργίας",
      image_url: img("photo-1519494026892-80bbd2d6fd0d"),
      status: "published",
      featured: false,
    },
    {
      slug: "eq-001",
      category: "equipment",
      title: "Ψηφιακό πανοραμικό ακτινολογικό Vatech",
      city: "Αθήνα",
      region: "Αττική",
      price: "18500",
      price_unit: "total",
      price_label: "€18.500",
      badge: "Μεταχειρισμένο",
      meta: "Έτος 2021 · Service contract",
      image_url: img("photo-1666214280391-8ff5bd3c0bf0"),
      status: "published",
      featured: true,
    },
    {
      slug: "eq-002",
      category: "equipment",
      title: "Υπερηχογράφος GE Logiq E10",
      city: "Πάτρα",
      region: "Δυτική Ελλάδα",
      price_label: "Κατόπιν επικοινωνίας",
      badge: "Refurbished",
      meta: "3 ηχοβολείς · Εγγύηση 12 μήνες",
      image_url: img("photo-1551601651-2a8555f1a136"),
      status: "published",
      featured: false,
    },
    {
      slug: "eq-003",
      category: "equipment",
      title: "Οδοντιατρική έδρα KaVo Estetica E50",
      city: "Θεσσαλονίκη",
      region: "Κεντρική Μακεδονία",
      price: "8900",
      price_unit: "total",
      price_label: "€8.900",
      badge: "Leasing διαθέσιμο",
      meta: "Εγκατάσταση + εκπαίδευση",
      image_url: img("photo-1606811971618-4486d14f3f99"),
      status: "published",
      featured: false,
    },
    {
      slug: "jb-001",
      category: "jobs",
      title: "Καρδιολόγος — Ιδιωτική κλινική",
      city: "Αθήνα",
      region: "Αττική",
      badge: "Πλήρης απασχόληση",
      meta: "5+ έτη εμπειρία · Άριστα Αγγλικά",
      image_url: img("photo-1612349317150-e413f6a5b16d"),
      status: "published",
      featured: true,
    },
    {
      slug: "jb-002",
      category: "jobs",
      title: "Νοσηλευτής/τρια ΤΕ για διαγνωστικό κέντρο",
      city: "Ηράκλειο",
      region: "Κρήτη",
      badge: "Μερική απασχόληση",
      meta: "Πρωινή βάρδια · Άμεση πρόσληψη",
      image_url: img("photo-1631815588090-d4bfec5b1ccb"),
      status: "published",
      featured: false,
    },
    {
      slug: "sup-001",
      category: "supplies",
      title: "Αναλώσιμα οδοντιατρείου — Χονδρική",
      city: "Πανελλαδικά",
      badge: "Προμηθευτής",
      meta: "Γάντια · Μάσκες · Στειρωτικά",
      image_url: img("photo-1583912267550-d6c2ac3196c0"),
      status: "published",
      featured: false,
    },
    {
      slug: "sup-002",
      category: "supplies",
      title: "Έπιπλα ιατρείου & εξεταστικά κρεβάτια",
      city: "Πανελλαδικά",
      badge: "Κατάλογος 2026",
      meta: "Παράδοση 5–10 εργάσιμες",
      image_url: img("photo-1538108149393-fbbd81895907"),
      status: "published",
      featured: false,
    },
    {
      slug: "sv-001",
      category: "services",
      title: "Αδειοδότηση & συμμόρφωση ιατρείων",
      city: "Πανελλαδικά",
      badge: "Σύμβουλοι",
      meta: "Φάκελος ΕΟΠΥΥ · ΕΟΦ · Πυρασφάλεια",
      image_url: img("photo-1450101499163-c8848c66ca85"),
      status: "published",
      featured: false,
    },
    {
      slug: "sv-002",
      category: "services",
      title: "Leasing ιατρικού εξοπλισμού έως 60 μήνες",
      city: "Πανελλαδικά",
      badge: "Τράπεζα συνεργάτης",
      meta: "Έγκριση σε 48 ώρες",
      image_url: img("photo-1554224155-6726b3ff858f"),
      status: "published",
      featured: false,
    },
  ];

  await db
    .insert(schema.listingsTable)
    .values(listings)
    .onConflictDoNothing({ target: schema.listingsTable.slug });

  console.log(`  → ${listings.length} listings seeded.`);
}

async function seedAdminRole() {
  console.log("Seeding admin user role…");

  const TEST_ADMIN_USER_ID = "seed_admin_user_001";

  await db
    .delete(schema.userRolesTable)
    .where(eq(schema.userRolesTable.user_id, TEST_ADMIN_USER_ID));

  await db
    .insert(schema.userRolesTable)
    .values({ user_id: TEST_ADMIN_USER_ID, role: "admin" });

  console.log(`  → Admin role seeded for user_id="${TEST_ADMIN_USER_ID}".`);
}

async function seedDoctorProfile() {
  console.log("Seeding doctor profile…");

  const TEST_DOCTOR_USER_ID = "seed_doctor_user_001";

  await db
    .insert(schema.doctorProfilesTable)
    .values({
      user_id: TEST_DOCTOR_USER_ID,
      full_name: "Δρ. Αλέξανδρος Παπαδόπουλος",
      specialty: "Καρδιολόγος",
      city: "Αθήνα",
      email: "dr.papadopoulos@example.com",
      phone: "2101234567",
      address: "Βασιλίσσης Σοφίας 45, Αθήνα 115 21",
      bio: "Καρδιολόγος με 15 χρόνια εμπειρία στον ιδιωτικό και δημόσιο τομέα. Ειδίκευση στην επεμβατική καρδιολογία και υπερηχοκαρδιογράφηση.",
      subscription_tier: "premium",
      is_published: true,
      verified: true,
    })
    .onConflictDoUpdate({
      target: schema.doctorProfilesTable.user_id,
      set: {
        full_name: "Δρ. Αλέξανδρος Παπαδόπουλος",
        specialty: "Καρδιολόγος",
        city: "Αθήνα",
        subscription_tier: "premium",
        is_published: true,
        verified: true,
      },
    });

  await db
    .delete(schema.doctorAvailabilityTable)
    .where(eq(schema.doctorAvailabilityTable.user_id, TEST_DOCTOR_USER_ID));

  await db
    .insert(schema.doctorAvailabilityTable)
    .values([
      { user_id: TEST_DOCTOR_USER_ID, day_of_week: 1, start_time: "09:00", end_time: "17:00" },
      { user_id: TEST_DOCTOR_USER_ID, day_of_week: 2, start_time: "09:00", end_time: "17:00" },
      { user_id: TEST_DOCTOR_USER_ID, day_of_week: 3, start_time: "09:00", end_time: "13:00" },
      { user_id: TEST_DOCTOR_USER_ID, day_of_week: 4, start_time: "09:00", end_time: "17:00" },
      { user_id: TEST_DOCTOR_USER_ID, day_of_week: 5, start_time: "09:00", end_time: "15:00" },
    ]);

  console.log(`  → Doctor profile + availability seeded for user_id="${TEST_DOCTOR_USER_ID}".`);
}

async function main() {
  console.log("Starting seed…");

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.listingsTable);

  if (count > 0) {
    console.log(`  → ${count} listings already exist — skipping seed.`);
    await pool.end();
    return;
  }

  await seedListings();
  await seedAdminRole();
  await seedDoctorProfile();
  console.log("Seed complete.");
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
