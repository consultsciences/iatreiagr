import { db } from "@workspace/db";
import { listingsTable } from "@workspace/db";

const listings = [
  // ── SPACES ──────────────────────────────────────────────────────────────
  {
    slug: "iatreio-kardiologou-athinon-kentro",
    category: "spaces",
    title: "Ιατρείο Καρδιολόγου – Κέντρο Αθήνας",
    description:
      "Πλήρως εξοπλισμένο ιατρείο 65τμ στο κέντρο της Αθήνας, ιδανικό για καρδιολόγο ή παθολόγο. Αίθουσα αναμονής, γραφείο, εξεταστήριο. Διαθέσιμο από 1η Ιουνίου.",
    city: "Αθήνα",
    region: "Αττική",
    price: "1200",
    price_unit: "month",
    price_label: "€1.200/μήνα",
    badge: "Featured",
    image_url:
      "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80",
    contact_name: "Μαρία Αναγνωστοπούλου",
    contact_email: "info@iatreio-kentro.gr",
    contact_phone: "210 3214567",
    featured: true,
    status: "published",
    payment_status: "paid",
  },
  {
    slug: "odontiatreio-glyfada-pros-enoikio",
    category: "spaces",
    title: "Οδοντιατρείο 80τμ – Γλυφάδα",
    description:
      "Λειτουργικό οδοντιατρείο 80τμ με δύο εξεταστήρια, sterilization room, ψηφιακή ακτινογραφία και αίθουσα αναμονής 10 ατόμων. Ασανσέρ, ΑμεΑ πρόσβαση.",
    city: "Γλυφάδα",
    region: "Αττική",
    price: "1500",
    price_unit: "month",
    price_label: "€1.500/μήνα",
    image_url:
      "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80",
    contact_name: "Σταύρος Παπαδάκης",
    contact_email: "stavros@glyfada-space.gr",
    contact_phone: "210 9645321",
    featured: false,
    status: "published",
    payment_status: "paid",
  },
  {
    slug: "diagnostiko-kentro-thessaloniki-pros-polisi",
    category: "spaces",
    title: "Διαγνωστικό Κέντρο 250τμ – Θεσσαλονίκη",
    description:
      "Ολοκληρωμένο διαγνωστικό κέντρο 250τμ προς πώληση στο κέντρο της Θεσσαλονίκης. Περιλαμβάνει εργαστήριο, αίθουσα υπερήχων, μαστογράφο. Ισόγειο, πολλαπλές θέσεις parking.",
    city: "Θεσσαλονίκη",
    region: "Κεντρική Μακεδονία",
    price: "380000",
    price_unit: "fixed",
    price_label: "€380.000",
    badge: "Νέο",
    image_url:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
    contact_name: "Νίκος Θεοδωρίδης",
    contact_email: "nikos@thessaloniki-diag.gr",
    contact_phone: "2310 448821",
    featured: true,
    status: "published",
    payment_status: "paid",
  },
  {
    slug: "iatreio-patra-eenoikio-mikro",
    category: "spaces",
    title: "Μικρό Ιατρείο 30τμ – Πάτρα",
    description:
      "Ιδανικό για νεοεισερχόμενο ιατρό. Ανακαινισμένο ιατρείο 30τμ στην Πάτρα, χαμηλό κόστος, κοντά σε νοσοκομείο. Κοινόχρηστη αίθουσα αναμονής.",
    city: "Πάτρα",
    region: "Δυτική Ελλάδα",
    price: "450",
    price_unit: "month",
    price_label: "€450/μήνα",
    image_url:
      "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&q=80",
    contact_name: "Ελένη Μιχαλοπούλου",
    contact_email: "eleni@patra-iatreio.gr",
    featured: false,
    status: "published",
    payment_status: "free",
  },

  // ── EQUIPMENT ───────────────────────────────────────────────────────────
  {
    slug: "ultrasound-toshiba-aplio-500-occasion",
    category: "equipment",
    title: "Υπέρηχος Toshiba Aplio 500 – Μεταχειρισμένος",
    description:
      "Υπέρηχος Toshiba Aplio 500 2018, αρίστη κατάσταση, 12.000 ώρες λειτουργίας. Συνοδεύεται από 3 κεφαλές (κοιλιακή, καρδιολογική, αγγειολογική). Εγγύηση 6 μηνών.",
    city: "Αθήνα",
    region: "Αττική",
    price: "18000",
    price_unit: "fixed",
    price_label: "€18.000",
    badge: "Featured",
    image_url:
      "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&q=80",
    contact_name: "MedEquip AE",
    contact_email: "sales@medequip.gr",
    contact_phone: "210 6123456",
    featured: true,
    status: "published",
    payment_status: "paid",
  },
  {
    slug: "monada-odontiatriki-kavo-pelton-crane",
    category: "equipment",
    title: "Οδοντιατρική Μονάδα KaVo Pelton & Crane – Νέα",
    description:
      "Καινούρια οδοντιατρική μονάδα KaVo Pelton & Crane Spirit 3000, αδύνατη εξεύρεση στην αγορά. Ηλεκτρικός motor, ενσωματωμένη κάμερα, εγγύηση κατασκευαστή 3 έτη.",
    city: "Θεσσαλονίκη",
    region: "Κεντρική Μακεδονία",
    price: "9500",
    price_unit: "fixed",
    price_label: "€9.500",
    image_url:
      "https://images.unsplash.com/photo-1588776814546-1ffedde3e6a9?w=800&q=80",
    contact_name: "DentalPro Importers",
    contact_email: "info@dentalpro.gr",
    contact_phone: "2310 887766",
    featured: false,
    status: "published",
    payment_status: "paid",
  },
  {
    slug: "anasthisiotiko-makina-drager-leasing",
    category: "equipment",
    title: "Αναισθησιολογική Μηχανή Dräger Fabius GS – Leasing",
    description:
      "Dräger Fabius GS Premium διαθέσιμη μέσω leasing από €290/μήνα. Ιδανική για χειρουργεία ή κλινικές. Πλήρης τεχνική υποστήριξη, ανταλλακτικά, εκπαίδευση.",
    city: "Αθήνα",
    region: "Αττική",
    price: "290",
    price_unit: "month",
    price_label: "από €290/μήνα (leasing)",
    badge: "Leasing",
    image_url:
      "https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&q=80",
    contact_name: "MedLease Greece",
    contact_email: "lease@medlease.gr",
    contact_phone: "210 7654321",
    featured: true,
    status: "published",
    payment_status: "paid",
  },
  {
    slug: "aktinodiagnostiko-siemens-luminos-drf",
    category: "equipment",
    title: "Ακτινοδιαγνωστικό Siemens Luminos DRF – Μεταχ.",
    description:
      "Σύστημα ακτινοσκόπησης Siemens Luminos DRF, έτος 2015, 8.400 ώρες. Πλήρως συντηρημένο, πιστοποιημένο. Τιμή διαπραγματεύσιμη για γρήγορη αγορά.",
    city: "Ηράκλειο",
    region: "Κρήτη",
    price: "42000",
    price_unit: "fixed",
    price_label: "€42.000 (διαπρ.)",
    image_url:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
    contact_name: "RadiMed Crete",
    contact_email: "radimed@crete.gr",
    featured: false,
    status: "published",
    payment_status: "free",
  },

  // ── JOBS ────────────────────────────────────────────────────────────────
  {
    slug: "kardiologos-athinon-polykentro",
    category: "jobs",
    title: "Καρδιολόγος – Πολυϊατρείο Αθήνας",
    description:
      "Αναζητούμε εξειδικευμένο Καρδιολόγο για πλήρη απασχόληση σε σύγχρονο πολυϊατρείο στο Μαρούσι. Απαιτείται τίτλος ειδικότητας, εμπειρία >3 έτη. Ανταγωνιστικές αποδοχές, συνεχής εκπαίδευση.",
    city: "Αθήνα",
    region: "Αττική",
    price: "5500",
    price_unit: "month",
    price_label: "€4.500–€5.500/μήνα",
    badge: "Featured",
    image_url:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&q=80",
    contact_name: "HR Πολυϊατρείο Υγεία+",
    contact_email: "careers@ygeiaplus.gr",
    contact_phone: "210 6198000",
    featured: true,
    status: "published",
    payment_status: "paid",
  },
  {
    slug: "nosileftria-ektakton-thessaloniki",
    category: "jobs",
    title: "Νοσηλεύτρια Επειγόντων – Θεσσαλονίκη",
    description:
      "Κλινική Βόρειας Ελλάδας αναζητά νοσηλεύτρια/τή για τμήμα επειγόντων. Πτυχίο ΑΕΙ/ΤΕΙ Νοσηλευτικής, εμπειρία σε επείγοντα τουλάχιστον 2 ετών. Εναλλασσόμενες βάρδιες.",
    city: "Θεσσαλονίκη",
    region: "Κεντρική Μακεδονία",
    price: "1800",
    price_unit: "month",
    price_label: "€1.600–€1.800/μήνα",
    image_url:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80",
    contact_name: "Γ.Ν. Αγ. Παύλος HR",
    contact_email: "hr@agiospaulos.gr",
    featured: false,
    status: "published",
    payment_status: "paid",
  },
  {
    slug: "dioikitikos-iatreio-patra-part-time",
    category: "jobs",
    title: "Διοικητικός/ή – Ιατρείο Πάτρας (μερική)",
    description:
      "Ιδιωτικό ιατρείο παθολόγου στην Πάτρα αναζητά διοικητικό υπάλληλο (μερική απασχόληση, πρωί). Εμπειρία σε χρήση ιατρικού λογισμικού (Mediware/Hippocrates), φιλική παρουσία.",
    city: "Πάτρα",
    region: "Δυτική Ελλάδα",
    price: "700",
    price_unit: "month",
    price_label: "€700/μήνα (μερική)",
    image_url:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80",
    contact_name: "Δρ. Κ. Μαυρόπουλος",
    contact_email: "mavropoulos@iatreiopa.gr",
    featured: false,
    status: "published",
    payment_status: "free",
  },

  // ── SUPPLIES ─────────────────────────────────────────────────────────────
  {
    slug: "analosima-xeirugeio-medisurg-prostater",
    category: "supplies",
    title: "MediSurg – Αναλώσιμα Χειρουργείου Χονδρική",
    description:
      "Εξειδικευμένος προμηθευτής αναλωσίμων χειρουργείου: γάντια, μάσκες, ράμματα, συσκευασίες στείρωσης. Διανομή σε όλη την Ελλάδα, ανταγωνιστικές τιμές χονδρικής, πιστοποίηση CE/ISO.",
    city: "Αθήνα",
    region: "Αττική",
    badge: "Featured",
    image_url:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
    contact_name: "MediSurg AE",
    contact_email: "wholesale@medisurg.gr",
    contact_phone: "210 5556677",
    featured: true,
    status: "published",
    payment_status: "paid",
  },
  {
    slug: "farmakeftika-analosima-odontiatreia-bulk",
    category: "supplies",
    title: "Φαρμακευτικά Αναλώσιμα Οδοντιατρείων – Bulk",
    description:
      "Χονδρική διάθεση φαρμακευτικών αναλωσίμων για οδοντιατρεία: σύριγγες, βελόνες, αιμοστατικά, εκμαγεία. Ελάχιστη παραγγελία €150, δωρεάν μεταφορικά άνω των €300.",
    city: "Πειραιάς",
    region: "Αττική",
    image_url:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80",
    contact_name: "DentaSupply Ltd",
    contact_email: "orders@dentasupply.gr",
    featured: false,
    status: "published",
    payment_status: "paid",
  },

  // ── SERVICES ──────────────────────────────────────────────────────────────
  {
    slug: "adeiodotisi-iatreion-nomiki-ypiris",
    category: "services",
    title: "Αδειοδότηση Ιατρείων & Κλινικών – Νομική Υπηρεσία",
    description:
      "Εξειδικευμένη νομική υποστήριξη για άδειες λειτουργίας ιατρείων, πολυϊατρείων και κλινικών. Συνεργασία με Υπουργείο Υγείας, ΕΟΠΥΥ, Περιφέρειες. Γρήγορη διεκπεραίωση, διαφανείς αμοιβές.",
    city: "Αθήνα",
    region: "Αττική",
    badge: "Featured",
    image_url:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
    contact_name: "MedLaw Partners",
    contact_email: "info@medlaw.gr",
    contact_phone: "210 3628900",
    featured: true,
    status: "published",
    payment_status: "paid",
  },
  {
    slug: "kataskevi-anakainis-iatrion-architektonik",
    category: "services",
    title: "Κατασκευή & Ανακαίνιση Ιατρείων – Αρχιτεκτονική",
    description:
      "Αρχιτεκτονικό γραφείο εξειδικευμένο σε ιατρικούς χώρους. Σχεδιασμός, αδειοδότηση, κατασκευή. Γνώση ΕΛΟΤ ΕΝ, GDPR διάταξης, προσβασιμότητας ΑμεΑ. Αναφορές διαθέσιμες.",
    city: "Θεσσαλονίκη",
    region: "Κεντρική Μακεδονία",
    image_url:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80",
    contact_name: "MedSpace Architects",
    contact_email: "studio@medspace-arch.gr",
    featured: false,
    status: "published",
    payment_status: "paid",
  },
  {
    slug: "logistiki-forologia-iatroi-epaggelm",
    category: "services",
    title: "Λογιστική & Φορολογία για Ιατρούς – Ειδικοί",
    description:
      "Εξειδικευμένο λογιστικό γραφείο για ελεύθερους επαγγελματίες ιατρούς. Τήρηση βιβλίων, ΦΠΑ, φορολογική δήλωση, αμοιβολόγιο ΕΟΠΥΥ, εισφορές ΕΦΚΑ. Πάγια αμοιβή €80/μήνα.",
    city: "Αθήνα",
    region: "Αττική",
    price: "80",
    price_unit: "month",
    price_label: "από €80/μήνα",
    image_url:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80",
    contact_name: "MedAccount Office",
    contact_email: "contact@medaccount.gr",
    featured: false,
    status: "published",
    payment_status: "free",
  },
];

async function seed() {
  console.log(`Seeding ${listings.length} listings...`);
  let inserted = 0;
  for (const listing of listings) {
    try {
      await db.insert(listingsTable).values(listing).onConflictDoNothing();
      inserted++;
      process.stdout.write(".");
    } catch (err) {
      console.error(`\nFailed to insert "${listing.title}":`, err);
    }
  }
  console.log(`\nDone. Inserted ${inserted}/${listings.length} listings.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
