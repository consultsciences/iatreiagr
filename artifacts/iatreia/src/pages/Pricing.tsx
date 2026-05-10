import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Check, Star, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type Plan = {
  plan?: string;
  name: string;
  price: string;
  period?: string;
  desc: string;
  cta: string;
  features: string[];
  highlight?: boolean;
  isEnterprise?: boolean;
  isContact?: boolean;
};

type PlanGroup = {
  id: string;
  title: string;
  audience: string;
  plans: Plan[];
};

const planGroups: PlanGroup[] = [
  {
    id: "individuals",
    title: "Ιδιώτες / Επαγγελματίες",
    audience: "Ιατροί, φυσιοθεραπευτές και άλλοι επαγγελματίες υγείας",
    plans: [
      {
        name: "Free",
        price: "€0",
        period: "πάντα",
        desc: "1 ενεργή αγγελία. Απαιτείται εγγραφή και επαλήθευση email.",
        cta: "Εγγραφή & Δημοσίευση",
        features: [
          "1 ενεργή αγγελία",
          "Απαιτείται εγγραφή & επαλήθευση email",
          "Βασικό προφίλ",
          "Φόρμα ενδιαφέροντος",
        ],
      },
      {
        plan: "plus",
        name: "Plus",
        price: "€19",
        period: "/αγγελία",
        desc: "Μία πληρωμένη αγγελία χωρίς μηνιαία συνδρομή.",
        cta: "Επιλέξτε Plus",
        features: [
          "1 αγγελία",
          "Πλήρης ορατότητα επικοινωνίας",
          "Χωρίς μηνιαία δέσμευση",
          "Email ειδοποιήσεις",
        ],
      },
      {
        plan: "featured_boost",
        name: "Featured Boost",
        price: "€29",
        period: "/αγγελία",
        desc: "Προβολή στην κορυφή της κατηγορίας για 7 ημέρες.",
        cta: "Ενίσχυση αγγελίας",
        features: [
          "Featured σήμανση 7 ημερών",
          "Top placement κατηγορίας",
          "Αυξημένη ορατότητα",
        ],
      },
      {
        plan: "verified_pro",
        name: "Verified Pro",
        price: "€29",
        period: "εφάπαξ",
        desc: "Επαληθευμένο σήμα στο προφίλ σας — μία φορά, για πάντα.",
        cta: "Αποκτήστε Verified",
        features: [
          "✓ Verified σήμα προφίλ",
          "Εφάπαξ πληρωμή",
          "Αυξημένη αξιοπιστία",
        ],
      },
    ],
  },
  {
    id: "starter",
    title: "Starter Κλινική / Starter Πωλητής",
    audience: "Ιατρεία και μικρές επιχειρήσεις με τακτικές ανάγκες καταχώρισης",
    plans: [
      {
        plan: "starter",
        name: "Starter",
        price: "€39",
        period: "/μήνα",
        desc: "Ιδανικό για μικρά ιατρεία και starter καταχωρητές.",
        cta: "Επιλέξτε Starter",
        highlight: true,
        features: [
          "3 ενεργές αγγελίες",
          "Αποθηκευμένες αγγελίες",
          "Featured ορατότητα",
          "Email υποστήριξη",
        ],
      },
    ],
  },
  {
    id: "brokers",
    title: "Μεσίτες / Ιδιοκτήτες",
    audience: "Μεσιτικά γραφεία και ιδιοκτήτες ιατρικών χώρων",
    plans: [
      {
        plan: "pro_broker",
        name: "Pro",
        price: "€99",
        period: "/μήνα",
        desc: "Για μεσίτες και ιδιοκτήτες με πολλαπλούς ιατρικούς χώρους.",
        cta: "Επιλέξτε Pro",
        features: [
          "10 ενεργές αγγελίες",
          "Εταιρικό προφίλ",
          "Featured εκπτώσεις",
          "Στόχευση πόλης",
        ],
      },
    ],
  },
  {
    id: "suppliers",
    title: "Προμηθευτές Εξοπλισμού",
    audience: "Εταιρείες ιατρικού εξοπλισμού και αναλωσίμων",
    plans: [
      {
        plan: "pro_supplier",
        name: "Pro",
        price: "€149",
        period: "/μήνα",
        desc: "Για προμηθευτές εξοπλισμού με εκτεταμένο κατάλογο.",
        cta: "Επιλέξτε Pro",
        features: [
          "15 ενεργές αγγελίες",
          "Ανεβάσματα brochure (PDF)",
          "Εταιρική σελίδα",
          "Πλήρη στατιστικά leads",
        ],
      },
    ],
  },
  {
    id: "recruiters",
    title: "Recruiters / Κλινικές που Προσλαμβάνουν",
    audience: "Κλινικές, νοσοκομεία και εταιρείες που αναζητούν ιατρικό προσωπικό",
    plans: [
      {
        plan: "job_single",
        name: "1 Αγγελία Εργασίας",
        price: "€39",
        period: "/ 30 ημέρες",
        desc: "Μία αγγελία εργασίας ενεργή για 30 ημέρες.",
        cta: "Δημοσίευση αγγελίας",
        features: [
          "1 αγγελία 30 ημερών",
          "Πλήρης ορατότητα",
          "Email ειδοποιήσεις υποψηφίων",
        ],
      },
      {
        plan: "job_pack",
        name: "5-Pack",
        price: "€139",
        period: "",
        desc: "5 αγγελίες εργασίας με εκπτωτικό πακέτο.",
        cta: "Αγορά 5-Pack",
        highlight: true,
        features: [
          "5 αγγελίες εργασίας",
          "Εξοικονόμηση €56",
          "Credits χωρίς λήξη",
          "Email ειδοποιήσεις υποψηφίων",
        ],
      },
      {
        plan: "hiring_plan",
        name: "Hiring Plan",
        price: "€249",
        period: "/μήνα",
        desc: "Απεριόριστες αγγελίες εργασίας για ενεργές κλινικές.",
        cta: "Επιλέξτε Hiring Plan",
        features: [
          "Απεριόριστες αγγελίες εργασίας",
          "Εταιρικό προφίλ εργοδότη",
          "Featured προβολή",
          "Προτεραιότητα υποστήριξης",
        ],
      },
    ],
  },
  {
    id: "partners",
    title: "Συνεργάτες / Σύμβουλοι / Τράπεζες",
    audience: "Leasing, τράπεζες, συμβουλευτικές εταιρείες και εθνικοί συνεργάτες",
    plans: [
      {
        plan: "premium_profile",
        name: "Premium Profile",
        price: "€99",
        period: "/μήνα",
        desc: "Εταιρικό premium προφίλ με φόρμα επικοινωνίας.",
        cta: "Επιλέξτε Premium Profile",
        features: [
          "Εταιρικό premium προφίλ",
          "Featured σήμανση",
          "Φόρμα επικοινωνίας από γιατρούς",
          "Στατιστικά leads",
        ],
      },
      {
        plan: "featured_partner",
        name: "Featured Partner",
        price: "€149",
        period: "/μήνα",
        desc: "Αφιερωμένη σελίδα με logo, website link και φόρμα επικοινωνίας.",
        cta: "Επιλέξτε Featured Partner",
        highlight: true,
        features: [
          "Αφιερωμένη σελίδα partner",
          "Logo & website link",
          "Φόρμα επικοινωνίας από γιατρούς",
          "Προβολή στο clinic-launch",
        ],
      },
      {
        plan: "sponsor",
        name: "Sponsor Package",
        price: "€299+",
        period: "/μήνα",
        desc: "Sponsorships, banners και co-branding σε όλο το iatreia.gr.",
        cta: "Επικοινωνία",
        isContact: true,
        features: [
          "Banners & sponsorships",
          "Newsletter co-branding",
          "City page placements",
          "Custom landing page",
        ],
      },
      {
        name: "Enterprise",
        price: "Custom",
        desc: "Για μεγάλες εταιρείες με ειδικές ανάγκες και υψηλό όγκο.",
        cta: "Επικοινωνία πωλήσεων",
        isEnterprise: true,
        features: [
          "Απεριόριστες αγγελίες",
          "API & μαζική εισαγωγή",
          "SLA & dedicated team",
          "Custom τιμολόγηση",
        ],
      },
    ],
  },
];

const faqs = [
  { q: "Πληρώνω προμήθεια όταν κλείσω συμφωνία;", a: "Όχι. Δεν υπάρχουν προμήθειες συναλλαγών — μόνο συνδρομές και προαιρετικές χρεώσεις προβολής." },
  { q: "Μπορώ να αλλάξω πακέτο οποιαδήποτε στιγμή;", a: "Ναι, η αναβάθμιση και υποβάθμιση γίνεται με ένα κλικ από το dashboard σας." },
  { q: "Εκδίδετε τιμολόγιο;", a: "Ναι, για όλες τις πληρωμές εκδίδεται κανονικό τιμολόγιο παροχής υπηρεσιών." },
  { q: "Χρειάζεται εγγραφή για το δωρεάν πακέτο;", a: "Ναι. Ακόμη και για τη δωρεάν αγγελία απαιτείται εγγραφή και επαλήθευση email. Δεν υπάρχει δημοσίευση αγγελίας χωρίς επιβεβαιωμένο λογαριασμό." },
];

async function startCheckout(plan: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/stripe/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to create checkout session");
  }
  const data = await res.json() as { url: string };
  return data.url;
}

async function openBillingPortal(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/stripe/portal`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to open billing portal");
  const data = await res.json() as { url: string };
  return data.url;
}

const PlanCard = ({
  p,
  loadingPlan,
  isSignedIn,
  onPlanClick,
}: {
  p: Plan;
  loadingPlan: string | null;
  isSignedIn: boolean | undefined;
  onPlanClick: (p: Plan) => void;
}) => (
  <Card
    className={`relative flex flex-col p-6 ${p.highlight ? "border-primary shadow-[var(--shadow-elevated)] scale-[1.02]" : ""}`}
  >
    {p.highlight && (
      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground hover:bg-accent">
        <Star className="mr-1 h-3 w-3 fill-current" /> Δημοφιλές
      </Badge>
    )}
    <div className="mb-3">
      <h4 className="text-lg font-bold">{p.name}</h4>
    </div>
    <div className="mb-3">
      <span className="text-3xl font-bold">{p.price}</span>
      {p.period && <span className="text-sm text-muted-foreground"> {p.period}</span>}
    </div>
    <p className="mb-4 text-sm text-muted-foreground">{p.desc}</p>
    <ul className="mb-6 flex-1 space-y-2">
      {p.features.map((f) => (
        <li key={f} className="flex items-start gap-2 text-sm">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
        </li>
      ))}
    </ul>
    {p.isEnterprise || p.isContact ? (
      <Button asChild variant="outline" className="w-full">
        <Link to="/contact">{p.cta}</Link>
      </Button>
    ) : (
      <Button
        className={`w-full ${p.highlight ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
        variant={p.highlight ? "default" : "outline"}
        disabled={loadingPlan === p.plan}
        onClick={() => onPlanClick(p)}
      >
        {loadingPlan === p.plan ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Παρακαλώ περιμένετε...</>
        ) : (
          p.cta
        )}
      </Button>
    )}
  </Card>
);

const Pricing = () => {
  const { isSignedIn } = useUser();
  const [searchParams] = useSearchParams();
  const checkoutResult = searchParams.get("checkout");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (checkoutResult) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [checkoutResult]);

  const handlePlanClick = async (p: Plan) => {
    if (!isSignedIn) {
      window.location.href = `/auth?redirect=/pricing`;
      return;
    }

    if (!p.plan) {
      window.location.href = "/post";
      return;
    }

    setError(null);
    setLoadingPlan(p.plan);
    try {
      const url = await startCheckout(p.plan);
      window.location.href = url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Σφάλμα. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {checkoutResult === "success" && (
        <div className="border-b bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-800">
          Η εγγραφή σας ολοκληρώθηκε! Το πακέτο σας ενεργοποιήθηκε.{" "}
          <Link to="/my-listings" className="underline">Δείτε τις αγγελίες σας →</Link>
        </div>
      )}
      {checkoutResult === "cancel" && (
        <div className="border-b bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          Η πληρωμή ακυρώθηκε. Μπορείτε να δοκιμάσετε ξανά οποιαδήποτε στιγμή.
        </div>
      )}
      {error && (
        <div className="border-b bg-red-50 px-4 py-3 text-center text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="border-b py-14" style={{ background: "var(--gradient-soft)" }}>
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">Τιμολόγηση</Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Πληρώστε για προβολή — ποτέ για συναλλαγές.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Διαφανή πακέτα για κάθε κατηγορία επαγγελματία υγείας. Δωρεάν εκκίνηση — απαιτείται εγγραφή.
          </p>
        </div>
      </section>

      {planGroups.map((group) => (
        <section
          key={group.id}
          id={group.id}
          className="border-b py-12 last:border-b-0"
        >
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-2xl font-bold md:text-3xl">{group.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{group.audience}</p>
            </div>
            <div
              className={`grid gap-5 ${
                group.plans.length === 1
                  ? "max-w-sm"
                  : group.plans.length === 2
                    ? "sm:grid-cols-2 max-w-2xl"
                    : group.plans.length === 3
                      ? "sm:grid-cols-2 lg:grid-cols-3"
                      : "sm:grid-cols-2 lg:grid-cols-4"
              }`}
            >
              {group.plans.map((p) => (
                <PlanCard
                  key={p.name}
                  p={p}
                  loadingPlan={loadingPlan}
                  isSignedIn={isSignedIn}
                  onPlanClick={handlePlanClick}
                />
              ))}
            </div>
          </div>
        </section>
      ))}

      {isSignedIn && (
        <section className="border-t py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            Ήδη συνδρομητής;{" "}
            <button
              className="underline hover:text-foreground"
              onClick={async () => {
                try {
                  const url = await openBillingPortal();
                  window.location.href = url;
                } catch {
                  setError("Αδυναμία ανοίγματος πύλης χρέωσης.");
                }
              }}
            >
              Διαχειριστείτε τη συνδρομή σας →
            </button>
          </div>
        </section>
      )}

      <section className="border-t bg-secondary/40 py-14">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold md:text-3xl">Συχνές ερωτήσεις τιμολόγησης</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f) => (
              <Card key={f.q} className="p-5">
                <div className="font-semibold">{f.q}</div>
                <div className="mt-1.5 text-sm text-muted-foreground">{f.a}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Pricing;
