import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Sparkles, Star } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const packages = [
  {
    slug: "dental",
    title: "Άνοιγμα Οδοντιατρείου",
    desc: "Από τον χώρο μέχρι την πρώτη ημέρα λειτουργίας — συντονισμένα.",
    steps: ["Επιλογή χώρου 40–80τ.μ.", "2 έδρες & ψηφιακή ακτινολογία", "Άδεια λειτουργίας", "Leasing έως 60 μήνες"],
  },
  {
    slug: "diagnostic",
    title: "Διαγνωστικό Κέντρο",
    desc: "Πλήρη πακέτα για U/S, MRI/CT, μικροβιολογικό ή πολυδύναμο.",
    steps: ["Χώρος 150–400τ.μ.", "Επιλογή εξοπλισμού", "Φάκελος ΕΟΠΥΥ", "Στελέχωση & marketing"],
  },
  {
    slug: "dermatology",
    title: "Δερματολογικό / Αισθητική",
    desc: "Laser, αναλώσιμα, marketing και αδειοδότηση σε ένα πακέτο.",
    steps: ["Επιλογή χώρου", "Laser & συσκευές", "Συμμόρφωση & άδειες", "Συμβόλαια προμηθειών"],
  },
  {
    slug: "general",
    title: "Γενικό Ιατρείο",
    desc: "Απλό, οικονομικό και γρήγορο setup για παθολόγους & ειδικότητες.",
    steps: ["Χώρος 30–60τ.μ.", "Βασικός εξοπλισμός", "Άδεια & ασφάλεια", "Online παρουσία"],
  },
  {
    slug: "lab",
    title: "Μικροβιολογικό Εργαστήριο",
    desc: "Πλήρες laboratory setup με αναλυτές, σύστημα ποιότητας και άδεια.",
    steps: ["Χώρος με προδιαγραφές", "Αναλυτές biochem/hema", "ΕΣΥΔ διαπίστευση", "LIS λογισμικό"],
  },
  {
    slug: "physio",
    title: "Φυσικοθεραπευτήριο",
    desc: "Από TENS και υπερήχους μέχρι reformer και χώρο γυμναστικής.",
    steps: ["Χώρος 60–120τ.μ.", "Εξοπλισμός φυσικοθεραπείας", "Άδεια λειτουργίας", "Leasing & εκπαίδευση"],
  },
];

const ClinicLaunch = () => (
  <div className="min-h-screen bg-background">
    <SiteHeader />
    <section className="border-b py-16" style={{ background: "var(--gradient-soft)" }}>
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <Badge variant="secondary" className="mb-4"><Sparkles className="mr-1 h-3 w-3" /> Πακέτα Άνοιγμα Ιατρείου</Badge>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Ένας οδηγός. Όλοι οι συνεργάτες. Μηδέν χάσιμο χρόνου.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Βρείτε χώρο, εξοπλισμό, αδειοδότηση και χρηματοδότηση — όλα σε ένα μέρος.
        </p>
      </div>
    </section>

    <section className="py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <Card className="flex flex-col items-center gap-4 border-primary/20 bg-primary/5 p-6 text-center sm:flex-row sm:text-left">
          <Star className="h-10 w-10 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="font-bold text-foreground">Προσφέρετε υπηρεσίες ανοίγματος ιατρείου;</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Αποκτήστε αφιερωμένη σελίδα με πλήρη πρόταση, logo, website link & φόρμα επικοινωνίας.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link to="/advertise?type=clinic-launch">
              Καταχωρίστε τώρα <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </div>
    </section>

    <section className="pb-14 pt-6">
      <div className="container mx-auto grid gap-5 px-4 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((p) => (
          <Card key={p.slug} className="flex flex-col p-6 transition-shadow hover:shadow-[var(--shadow-elevated)]">
            <h3 className="mb-2 text-lg font-bold">{p.title}</h3>
            <p className="mb-5 text-sm text-muted-foreground">{p.desc}</p>
            <ul className="mb-6 flex-1 space-y-2">
              {p.steps.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {s}
                </li>
              ))}
            </ul>
            <Button asChild className="w-full text-left h-auto py-3 px-4 whitespace-normal leading-snug">
              <Link to="/pricing#partners">
                Παρέχετε Υπηρεσίες; Καταχωρίστε την εταιρία και τις υπηρεσίες που παρέχετε
                <ArrowRight className="ml-2 h-4 w-4 shrink-0 inline" />
              </Link>
            </Button>
          </Card>
        ))}
      </div>
    </section>
    <SiteFooter />
  </div>
);

export default ClinicLaunch;
