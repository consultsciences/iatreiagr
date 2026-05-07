import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, MapPin, Building2, Stethoscope, Briefcase, Package, HandCoins,
  ShieldCheck, ArrowRight, CheckCircle2, Sparkles, TrendingUp, Plus, Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ListingCard } from "@/components/listings/ListingCard";
import { fetchFeaturedListings, type DbListing } from "@/lib/listings";
import heroImg from "@/assets/hero-clinic.jpg";

const categories = [
  { to: "/spaces", icon: Building2, title: "Ιατρικοί Χώροι", desc: "Ιατρεία, κλινικές, διαγνωστικά κέντρα προς ενοικίαση ή πώληση", count: "120+ αγγελίες" },
  { to: "/equipment", icon: Stethoscope, title: "Ιατρικός Εξοπλισμός", desc: "Νέος, μεταχειρισμένος, refurbished — αγορά, leasing ή ενοικίαση", count: "340+ αγγελίες" },
  { to: "/jobs", icon: Briefcase, title: "Θέσεις Εργασίας", desc: "Ιατροί, οδοντίατροι, νοσηλευτές, διοικητικό προσωπικό", count: "85+ θέσεις" },
  { to: "/supplies", icon: Package, title: "Αναλώσιμα & Προμήθειες", desc: "Προμηθευτές αναλωσίμων, εξοπλισμού γραφείου, στειρωτικών", count: "60+ προμηθευτές" },
  { to: "/services", icon: HandCoins, title: "Υπηρεσίες & Συνεργάτες", desc: "Τράπεζες, leasing, αδειοδότηση, κατασκευή, νομικοί, λογιστές", count: "200+ συνεργάτες" },
  { to: "/clinic-launch", icon: Sparkles, title: "Άνοιγμα Ιατρείου", desc: "Ολοκληρωμένα πακέτα: χώρος + εξοπλισμός + άδειες + χρηματοδότηση", count: "Νέο" },
];

const cities = ["Αθήνα", "Θεσσαλονίκη", "Πάτρα", "Ηράκλειο", "Λάρισα", "Βόλος", "Ιωάννινα", "Χανιά"];

const trustStats = [
  { v: "8.500+", l: "Επαγγελματίες υγείας" },
  { v: "1.200+", l: "Ενεργές αγγελίες" },
  { v: "300+", l: "Επαληθευμένοι συνεργάτες" },
  { v: "48 ώρες", l: "Μέσος χρόνος ανταπόκρισης" },
];

const launchTypes = [
  "Οδοντιατρείο", "Διαγνωστικό κέντρο", "Δερματολογικό", "Παθολογικό",
  "Μικροβιολογικό εργαστήριο", "Φυσικοθεραπευτήριο", "Αισθητική ιατρική",
];

const partners = ["ΕΘΝΙΚΗ", "ALPHA LEASING", "PIRAEUS", "EUROBANK", "INTERAMERICAN", "AXA", "GENERALI", "ALLIANZ"];

const testimonials = [
  { name: "Δρ. Γεώργιος Π.", role: "Καρδιολόγος, Αθήνα", text: "Βρήκα το ιδανικό ιατρείο σε 10 ημέρες. Το iatreia.gr απλοποίησε όλη τη διαδικασία." },
  { name: "Μαρία Κ.", role: "Διευθύντρια οδοντιατρικής κλινικής", text: "Αγοράσαμε δύο μεταχειρισμένες έδρες με leasing μέσω συνεργάτη της πλατφόρμας. Άριστη εμπειρία." },
  { name: "Νικόλαος Α.", role: "Ιδρυτής διαγνωστικού κέντρου", text: "Βρήκα χώρο, εξοπλισμό και σύμβουλο αδειοδότησης σε μία πλατφόρμα. Εξοικονόμησα μήνες." },
];

const faqs = [
  { q: "Είναι δωρεάν η εγγραφή και η αναζήτηση;", a: "Ναι. Η εγγραφή, η αναζήτηση και η επικοινωνία με καταχωρητές είναι πάντα δωρεάν για επαγγελματίες υγείας." },
  { q: "Πώς λειτουργεί η καταχώριση αγγελίας;", a: "Δημιουργείτε λογαριασμό, επιλέγετε κατηγορία, συμπληρώνετε τα στοιχεία και η ομάδα μας ελέγχει την αγγελία πριν δημοσιευτεί. Διαθέσιμα δωρεάν και πληρωμένα πακέτα προβολής." },
  { q: "Πραγματοποιούνται αγοραπωλησίες μέσω της πλατφόρμας;", a: "Όχι. Το iatreia.gr είναι πλατφόρμα αγγελιών και διασύνδεσης. Όλες οι συμφωνίες, πληρωμές και νομικές διαδικασίες γίνονται απευθείας μεταξύ των ενδιαφερομένων." },
  { q: "Πώς εξασφαλίζετε την αξιοπιστία των αγγελιών;", a: "Όλες οι αγγελίες περνούν από έλεγχο. Επαγγελματίες και εταιρείες μπορούν να λάβουν επαληθευμένο σήμα μετά από έλεγχο εγγράφων." },
  { q: "Μπορώ να συνδέσω την αγγελία μου με το προφίλ μου στο iatreio.gr;", a: "Ναι. Οι λογαριασμοί iatreia.gr και iatreio.gr διασυνδέονται, ώστε ασθενείς και επαγγελματίες να βλέπουν συνδυασμένες πληροφορίες." },
];

const Index = () => {
  const [featured, setFeatured] = useState<DbListing[]>([]);
  useEffect(() => {
    fetchFeaturedListings(10).then(setFeatured).catch(() => {});
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b" style={{ background: "var(--gradient-soft)" }}>
        <div className="container relative mx-auto grid gap-10 px-4 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="flex flex-col justify-center">
            <Badge className="mb-5 w-fit border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Η νέα B2B πλατφόρμα για επαγγελματίες υγείας
            </Badge>
            <h1 className="mb-5 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Όλα όσα χρειάζεστε για να ανοίξετε,<br className="hidden lg:block" />
              <span className="text-primary"> να εξοπλίσετε ή να αναπτύξετε</span> το ιατρείο σας.
            </h1>
            <p className="mb-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Αναζητήστε ιατρεία προς ενοικίαση ή πώληση, ιατρικό εξοπλισμό, θέσεις εργασίας,
              προμηθευτές, χρηματοδοτήσεις και υπηρεσίες υποστήριξης για επαγγελματίες υγείας στην Ελλάδα.
            </p>

            <Card className="mb-5 p-2 shadow-[var(--shadow-elevated)]">
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Τι ψάχνετε; (π.χ. οδοντιατρείο, υπερηχογράφος, νοσηλευτής)"
                    className="h-12 border-0 pl-11 text-base focus-visible:ring-0"
                  />
                </div>
                <div className="hidden w-px bg-border md:block" />
                <div className="relative md:w-52">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Πόλη" className="h-12 border-0 pl-11 text-base focus-visible:ring-0" />
                </div>
                <Button size="lg" className="h-12 px-6 font-semibold">
                  <Search className="mr-2 h-4 w-4" /> Αναζήτηση Αγγελιών
                </Button>
              </div>
            </Card>

            <div className="mb-7 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Δημοφιλή:</span>
              {["Ιατρείο Αθήνα", "Οδοντιατρικός εξοπλισμός", "Leasing μηχανημάτων", "Θέσεις καρδιολόγου"].map((t) => (
                <button key={t} className="rounded-full border bg-background px-3 py-1 text-xs hover:border-primary hover:text-primary">
                  {t}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" size="lg">
                <Link to="/post"><Plus className="mr-2 h-4 w-4" /> Καταχώριση Αγγελίας</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link to="/clinic-launch">Ανοίξτε ιατρείο <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 blur-2xl" />
            <img
              src={heroImg}
              alt="Σύγχρονος ιατρικός χώρος προς ενοικίαση στην Ελλάδα"
              width={1600}
              height={1024}
              className="relative rounded-2xl object-cover shadow-2xl"
            />
            <Card className="absolute -bottom-6 -left-6 hidden w-64 p-4 shadow-2xl xl:block">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-primary">
                <TrendingUp className="h-4 w-4" /> ΤΑΣΗ
              </div>
              <div className="text-sm font-semibold">+38% νέες αγγελίες</div>
              <div className="text-xs text-muted-foreground">τους τελευταίους 3 μήνες</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b bg-background py-8">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-4 md:grid-cols-4">
          {trustStats.map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-2xl font-bold text-primary md:text-3xl">{s.v}</div>
              <div className="text-xs text-muted-foreground md:text-sm">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 max-w-2xl">
            <Badge variant="secondary" className="mb-3">Κατηγορίες</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Μία πλατφόρμα. Όλη η αγορά υγείας.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Από τον χώρο και τον εξοπλισμό μέχρι το προσωπικό και τη χρηματοδότηση.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link key={c.to} to={c.to}>
                <Card className="group h-full p-6 transition-all hover:-translate-y-1 hover:border-primary hover:shadow-[var(--shadow-elevated)]">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <c.icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{c.count}</span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{c.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
                  <div className="flex items-center gap-1 text-sm font-medium text-primary">
                    Εξερεύνηση <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured listings */}
      <section className="bg-secondary/40 py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <Badge variant="secondary" className="mb-3">Προτεινόμενες αγγελίες</Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Δείτε τι κινείται τώρα</h2>
            </div>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/spaces">Όλες οι αγγελίες <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 6).map((l) => (
              <ListingCard key={l.id} l={l} />
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 max-w-2xl">
            <Badge variant="secondary" className="mb-3">Περιοχές</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Αναζήτηση ανά πόλη</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {cities.map((c) => (
              <Link
                key={c}
                to={`/spaces?city=${encodeURIComponent(c)}`}
                className="flex items-center gap-2 rounded-lg border bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                <MapPin className="h-4 w-4 text-muted-foreground" /> {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Clinic launch */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <Card className="overflow-hidden border-0 bg-primary text-primary-foreground">
            <div className="grid gap-8 p-10 lg:grid-cols-[1.2fr_1fr] lg:p-16">
              <div>
                <Badge className="mb-4 border-white/20 bg-white/10 text-white hover:bg-white/20">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Πακέτα Άνοιγμα Ιατρείου
                </Badge>
                <h2 className="mb-4 text-3xl font-bold leading-tight lg:text-4xl">
                  Από την ιδέα στη λειτουργία — σε μία πλατφόρμα.
                </h2>
                <p className="mb-6 text-white/85">
                  Συνδυάστε χώρο, εξοπλισμό, αδειοδότηση, κατασκευή και χρηματοδότηση από
                  επαληθευμένους συνεργάτες. Ζητήστε ολοκληρωμένη πρόταση χωρίς κόστος.
                </p>
                <div className="mb-7 grid gap-2 sm:grid-cols-2">
                  {launchTypes.map((t) => (
                    <div key={t} className="flex items-center gap-2 text-sm text-white/95">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" /> {t}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link to="/clinic-launch">Ξεκινήστε τώρα</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                    <Link to="/contact">Μιλήστε με σύμβουλο</Link>
                  </Button>
                </div>
              </div>
              <div className="hidden grid-cols-2 gap-3 lg:grid">
                {featured.slice(6, 10).map((l) => (
                  <div key={l.id} className="overflow-hidden rounded-lg bg-white/5 p-3 backdrop-blur">
                    {l.image_url && <img src={l.image_url} alt={l.title} className="mb-2 h-24 w-full rounded object-cover" loading="lazy" />}
                    <div className="line-clamp-2 text-xs text-white/90">{l.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Partners */}
      <section className="border-y bg-secondary/30 py-12">
        <div className="container mx-auto px-4">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Συνεργαζόμαστε με κορυφαίους θεσμικούς εταίρους
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
            {partners.map((p) => (
              <span key={p} className="text-sm font-bold tracking-wider text-muted-foreground">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 max-w-2xl">
            <Badge variant="secondary" className="mb-3">Εμπιστοσύνη</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Τι λένε οι επαγγελματίες</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="p-6">
                <Quote className="mb-3 h-6 w-6 text-accent" />
                <p className="mb-5 text-sm leading-relaxed text-foreground/90">"{t.text}"</p>
                <div className="border-t pt-4">
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-secondary/40 py-16 lg:py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <Badge variant="secondary" className="mb-3">Συχνές ερωτήσεις</Badge>
          <h2 className="mb-8 text-3xl font-bold tracking-tight md:text-4xl">Καλό να ξέρετε</h2>
          <Accordion type="single" collapsible className="rounded-lg border bg-background">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`f${i}`} className="px-5">
                <AccordionTrigger className="text-left text-sm font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Seller CTA */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <Card className="overflow-hidden border-0" style={{ background: "var(--gradient-hero)" }}>
            <div className="grid items-center gap-8 p-10 md:grid-cols-2 lg:p-16">
              <div className="text-primary-foreground">
                <Badge className="mb-4 border-white/20 bg-white/10 text-white hover:bg-white/20">Για καταχωρητές</Badge>
                <h2 className="mb-4 text-3xl font-bold leading-tight lg:text-4xl">
                  Φτάστε στο πιο στοχευμένο κοινό της ελληνικής αγοράς υγείας.
                </h2>
                <p className="mb-6 text-white/90">
                  Δωρεάν εκκίνηση. Πληρώνετε μόνο για επιπλέον προβολή και προωθημένες αγγελίες.
                </p>
                <ul className="mb-7 space-y-2.5 text-white/95">
                  {[
                    "Δωρεάν Basic καταχώριση",
                    "Premium προβολή από €29/μήνα",
                    "Επαληθευμένο σήμα για εταιρείες",
                    "Πλήρη στατιστικά leads & προβολών",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" /> {t}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                    <Link to="/post">Καταχωρήστε αγγελία</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                    <Link to="/pricing">Δείτε πακέτα</Link>
                  </Button>
                </div>
              </div>
              <div className="hidden md:block">
                <img
                  src={heroImg}
                  alt="Επαγγελματίες υγείας στο iatreia.gr"
                  loading="lazy"
                  className="rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Index;
