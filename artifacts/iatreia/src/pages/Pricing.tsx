import { Link } from "react-router-dom";
import { Check, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

type Plan = {
  name: string;
  price: string;
  period?: string;
  desc: string;
  audience: string;
  cta: string;
  features: string[];
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    price: "€0",
    period: "πάντα",
    desc: "Για ιδιώτες επαγγελματίες με περιστασιακές καταχωρίσεις.",
    audience: "Ιδιώτες ιατροί",
    cta: "Ξεκινήστε δωρεάν",
    features: [
      "Έως 1 ενεργή αγγελία",
      "Βασικό προφίλ",
      "Φόρμα ενδιαφέροντος",
      "Email ειδοποιήσεις",
    ],
  },
  {
    name: "Starter",
    price: "€29",
    period: "/μήνα",
    desc: "Για όσους ξεκινούν να καταχωρούν τακτικά.",
    audience: "Ιατρεία & μικροί καταχωρητές",
    cta: "Επιλέξτε Starter",
    features: [
      "Έως 5 ενεργές αγγελίες",
      "Στοιχεία επικοινωνίας ορατά",
      "Βασικά στατιστικά",
      "Email υποστήριξη",
    ],
  },
  {
    name: "Professional",
    price: "€89",
    period: "/μήνα",
    desc: "Για ενεργούς καταχωρητές με ανάγκη προβολής.",
    audience: "Μεσίτες, διανομείς, εταιρείες",
    cta: "Επιλέξτε Professional",
    highlight: true,
    features: [
      "Έως 25 ενεργές αγγελίες",
      "Featured σήμανση",
      "PDF brochures",
      "Πλήρη lead analytics",
      "Εταιρικό προφίλ",
      "Προτεραιότητα υποστήριξης",
    ],
  },
  {
    name: "Premium",
    price: "€249",
    period: "/μήνα",
    desc: "Για εταιρείες με υψηλό όγκο και ανάγκη μεγάλης εμβέλειας.",
    audience: "Προμηθευτές & μεγάλες κλινικές",
    cta: "Επιλέξτε Premium",
    features: [
      "Έως 100 ενεργές αγγελίες",
      "Top placement σε κατηγορίες",
      "Επαληθευμένο σήμα",
      "Πολλαπλοί χρήστες",
      "Προβολή σε σελίδες πόλεων",
      "Account manager",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "Για banks, leasing companies, εθνικούς διανομείς και partners.",
    audience: "Banks, leasing, εθνικοί συνεργάτες",
    cta: "Επικοινωνία πωλήσεων",
    features: [
      "Απεριόριστες αγγελίες",
      "Custom landing pages",
      "API & μαζική εισαγωγή",
      "Sponsorships & banners",
      "Newsletter co-branding",
      "SLA & dedicated team",
    ],
  },
];

const addons = [
  { title: "Featured Listing", price: "€19/αγγελία", desc: "7 ημέρες προβολή στην κορυφή της κατηγορίας." },
  { title: "Urgent Tag", price: "€9/αγγελία", desc: "Σήμανση «Άμεσα» για ταχύτερη ανταπόκριση." },
  { title: "Homepage Spot", price: "€149/εβδομάδα", desc: "Προβολή στην πρώτη σελίδα του iatreia.gr." },
  { title: "City Banner", price: "€89/εβδομάδα", desc: "Banner σε στοχευμένη σελίδα πόλης." },
];

const faqs = [
  { q: "Πληρώνω προμήθεια όταν κλείσω συμφωνία;", a: "Όχι. Δεν υπάρχουν προμήθειες συναλλαγών — μόνο συνδρομές και προαιρετικές χρεώσεις προβολής." },
  { q: "Μπορώ να αλλάξω πακέτο οποιαδήποτε στιγμή;", a: "Ναι, η αναβάθμιση και υποβάθμιση γίνεται με ένα κλικ από το dashboard σας." },
  { q: "Εκδίδετε τιμολόγιο;", a: "Ναι, για όλες τις πληρωμές εκδίδεται κανονικό τιμολόγιο παροχής υπηρεσιών." },
];

const Pricing = () => (
  <div className="min-h-screen bg-background">
    <SiteHeader />

    <section className="border-b py-14" style={{ background: "var(--gradient-soft)" }}>
      <div className="container mx-auto px-4 text-center">
        <Badge variant="secondary" className="mb-4">Τιμολόγηση</Badge>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
          Πληρώστε για προβολή — ποτέ για συναλλαγές.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Διαφανή πακέτα για κάθε μέγεθος επιχείρησης. Δωρεάν εκκίνηση, αναβάθμιση όποτε χρειαστείτε.
        </p>
      </div>
    </section>

    <section className="py-14">
      <div className="container mx-auto px-4">
        <div className="grid gap-5 lg:grid-cols-5">
          {plans.map((p) => (
            <Card
              key={p.name}
              className={`relative flex flex-col p-6 ${p.highlight ? "border-primary shadow-[var(--shadow-elevated)] lg:scale-105" : ""}`}
            >
              {p.highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground hover:bg-accent">
                  <Star className="mr-1 h-3 w-3 fill-current" /> Δημοφιλές
                </Badge>
              )}
              <div className="mb-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{p.audience}</div>
                <h3 className="mt-1 text-xl font-bold">{p.name}</h3>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">{p.price}</span>
                {p.period && <span className="text-sm text-muted-foreground"> {p.period}</span>}
              </div>
              <p className="mb-5 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="mb-6 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`w-full ${p.highlight ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
                variant={p.highlight ? "default" : "outline"}
              >
                <Link to={p.name === "Enterprise" ? "/contact" : "/auth"}>{p.cta}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>

    <section className="border-t bg-secondary/40 py-14">
      <div className="container mx-auto px-4">
        <div className="mb-8 max-w-2xl">
          <Badge variant="secondary" className="mb-3"><Sparkles className="mr-1 h-3 w-3" /> Επιπλέον προβολή</Badge>
          <h2 className="text-2xl font-bold md:text-3xl">Add-ons για στοχευμένη ενίσχυση</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {addons.map((a) => (
            <Card key={a.title} className="p-5">
              <div className="mb-1 text-sm font-semibold text-primary">{a.price}</div>
              <h3 className="mb-2 text-lg font-bold">{a.title}</h3>
              <p className="text-sm text-muted-foreground">{a.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>

    <section className="py-14">
      <div className="container mx-auto max-w-3xl px-4">
        <h2 className="mb-6 text-2xl font-bold md:text-3xl">Συχνές ερωτήσεις τιμολόγησης</h2>
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

export default Pricing;
