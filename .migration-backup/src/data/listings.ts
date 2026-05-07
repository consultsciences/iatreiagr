// Sample seed listings for iatreia.gr — Greek B2B marketplace
// These are demo listings for the marketing-stage MVP.

export type ListingCategory = "spaces" | "equipment" | "jobs" | "supplies" | "services";

export interface SampleListing {
  id: string;
  category: ListingCategory;
  title: string;
  city: string;
  price?: string;
  badge?: string;
  meta: string;
  image: string;
}

const img = (q: string) =>
  `https://images.unsplash.com/${q}?w=800&h=560&fit=crop&auto=format&q=70`;

export const sampleListings: SampleListing[] = [
  // Spaces
  {
    id: "sp-001",
    category: "spaces",
    title: "Ιατρείο 95τ.μ. προς ενοικίαση — Κολωνάκι",
    city: "Αθήνα",
    price: "€1.450 / μήνα",
    badge: "Ενοικίαση",
    meta: "3 χώροι · Ρεσεψιόν · Ανακαινισμένο",
    image: img("photo-1497366216548-37526070297c"),
  },
  {
    id: "sp-002",
    category: "spaces",
    title: "Οδοντιατρείο πλήρως εξοπλισμένο — Γλυφάδα",
    city: "Αθήνα",
    price: "€185.000",
    badge: "Πώληση",
    meta: "70τ.μ. · 2 έδρες · Ισόγειο",
    image: img("photo-1629909613654-28e377c37b09"),
  },
  {
    id: "sp-003",
    category: "spaces",
    title: "Διαγνωστικό κέντρο 220τ.μ. — Καλαμαριά",
    city: "Θεσσαλονίκη",
    price: "€2.800 / μήνα",
    badge: "Ενοικίαση",
    meta: "Έτοιμο για άδεια λειτουργίας",
    image: img("photo-1519494026892-80bbd2d6fd0d"),
  },

  // Equipment
  {
    id: "eq-001",
    category: "equipment",
    title: "Ψηφιακό πανοραμικό ακτινολογικό Vatech",
    city: "Αθήνα",
    price: "€18.500",
    badge: "Μεταχειρισμένο",
    meta: "Έτος 2021 · Service contract",
    image: img("photo-1666214280391-8ff5bd3c0bf0"),
  },
  {
    id: "eq-002",
    category: "equipment",
    title: "Υπερηχογράφος GE Logiq E10",
    city: "Πάτρα",
    price: "Κατόπιν επικοινωνίας",
    badge: "Refurbished",
    meta: "3 ηχοβολείς · Εγγύηση 12 μήνες",
    image: img("photo-1551601651-2a8555f1a136"),
  },
  {
    id: "eq-003",
    category: "equipment",
    title: "Οδοντιατρική έδρα KaVo Estetica E50",
    city: "Θεσσαλονίκη",
    price: "€8.900",
    badge: "Leasing διαθέσιμο",
    meta: "Εγκατάσταση + εκπαίδευση",
    image: img("photo-1606811971618-4486d14f3f99"),
  },

  // Jobs
  {
    id: "jb-001",
    category: "jobs",
    title: "Καρδιολόγος — Ιδιωτική κλινική",
    city: "Αθήνα",
    badge: "Πλήρης απασχόληση",
    meta: "5+ έτη εμπειρία · Άριστα Αγγλικά",
    image: img("photo-1612349317150-e413f6a5b16d"),
  },
  {
    id: "jb-002",
    category: "jobs",
    title: "Νοσηλευτής/τρια ΤΕ για διαγνωστικό κέντρο",
    city: "Ηράκλειο",
    badge: "Μερική απασχόληση",
    meta: "Πρωινή βάρδια · Άμεση πρόσληψη",
    image: img("photo-1631815588090-d4bfec5b1ccb"),
  },

  // Supplies
  {
    id: "sup-001",
    category: "supplies",
    title: "Αναλώσιμα οδοντιατρείου — Χονδρική",
    city: "Πανελλαδικά",
    badge: "Προμηθευτής",
    meta: "Γάντια · Μάσκες · Στειρωτικά",
    image: img("photo-1583912267550-d6c2ac3196c0"),
  },
  {
    id: "sup-002",
    category: "supplies",
    title: "Έπιπλα ιατρείου & εξεταστικά κρεβάτια",
    city: "Πανελλαδικά",
    badge: "Κατάλογος 2026",
    meta: "Παράδοση 5–10 εργάσιμες",
    image: img("photo-1538108149393-fbbd81895907"),
  },

  // Services
  {
    id: "sv-001",
    category: "services",
    title: "Αδειοδότηση & συμμόρφωση ιατρείων",
    city: "Πανελλαδικά",
    badge: "Σύμβουλοι",
    meta: "Φάκελος ΕΟΠΥΥ · ΕΟΦ · Πυρασφάλεια",
    image: img("photo-1450101499163-c8848c66ca85"),
  },
  {
    id: "sv-002",
    category: "services",
    title: "Leasing ιατρικού εξοπλισμού έως 60 μήνες",
    city: "Πανελλαδικά",
    badge: "Τράπεζα συνεργάτης",
    meta: "Έγκριση σε 48 ώρες",
    image: img("photo-1554224155-6726b3ff858f"),
  },
];

export const featuredListings = sampleListings.slice(0, 6);
