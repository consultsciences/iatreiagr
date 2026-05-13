import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  ShieldCheck,
  Stethoscope,
  Smile,
  Sparkles,
  Scissors,
  Bone,
  Eye,
  Baby,
  Heart,
  Menu,
  ChevronRight,
  CheckCircle2,
  Plane,
  Banknote,
  Languages,
  Hotel,
  PhoneCall,
  User as UserIcon,
  LogOut,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const treatments = [
  { icon: Smile, name: "Dental implants", from: "from €650", note: "vs €2,500 UK" },
  { icon: Sparkles, name: "IVF / Fertility", from: "from €3,200", note: "vs €8,000 UK" },
  { icon: Scissors, name: "Cosmetic surgery", from: "from €1,800", note: "Rhinoplasty, lift" },
  { icon: Bone, name: "Orthopaedics", from: "from €4,500", note: "Hip & knee replacement" },
  { icon: Eye, name: "LASIK eye surgery", from: "from €900", note: "Both eyes, latest tech" },
  { icon: Baby, name: "Hair transplant", from: "from €1,500", note: "FUE, 3,000 grafts" },
  { icon: Heart, name: "Cardiology", from: "from €120", note: "Consultations & screening" },
  { icon: Stethoscope, name: "Bariatric surgery", from: "from €5,500", note: "Sleeve, bypass" },
];

const cities = ["Athens", "Thessaloniki", "Heraklion", "Santorini", "Mykonos"];

const articles = [
  {
    tag: "Dental",
    title: "All-on-4 implants in Greece: a step-by-step patient guide",
    read: "8 min read",
    img: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=600&h=400&fit=crop",
  },
  {
    tag: "Fertility",
    title: "IVF in Greece: success rates, costs and what to expect",
    read: "10 min read",
    img: "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=600&h=400&fit=crop",
  },
  {
    tag: "Travel",
    title: "Recovering by the Aegean: best post-surgery destinations",
    read: "6 min read",
    img: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&h=400&fit=crop",
  },
];

const IndexEn = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link to="/en" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                iatreia<span className="text-primary">.gr</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-6 lg:flex">
              <a href="#treatments" className="text-sm font-medium text-foreground/80 hover:text-primary">Treatments</a>
              <a href="#how" className="text-sm font-medium text-foreground/80 hover:text-primary">How it works</a>
              <a href="#doctors" className="text-sm font-medium text-foreground/80 hover:text-primary">Doctors</a>
              <Link to="/articles" className="text-sm font-medium text-foreground/80 hover:text-primary">Patient guides</Link>
              <Link to="/medical-tourism" className="text-sm font-medium text-foreground/80 hover:text-primary">Get a quote</Link>
              <Link to="/" className="text-sm font-medium text-foreground/80 hover:text-primary">GR 🇬🇷</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link to="/my-listings"><UserIcon className="mr-1.5 h-4 w-4" /> My listings</Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => signOut()} title="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
            <Button asChild className="hidden sm:inline-flex">
              <Link to="/medical-tourism#quote">Free quote</Link>
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="container relative mx-auto px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center text-primary-foreground">
            <Badge className="mb-4 border-white/20 bg-white/10 text-white hover:bg-white/20">
              <Plane className="mr-1 h-3 w-3" /> Medical tourism · Greece
            </Badge>
            <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              World-class healthcare,
              <br />
              <span className="text-white/90">under the Greek sun</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90">
              Save up to 70% vs UK, Germany & Scandinavia. JCI-certified clinics, English-speaking
              doctors, all-inclusive packages with hotel & transfers.
            </p>

            {/* Search Box */}
            <Card className="mx-auto max-w-3xl p-2 shadow-2xl">
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Treatment, condition or doctor name"
                    className="h-14 border-0 pl-11 text-base focus-visible:ring-0"
                  />
                </div>
                <div className="hidden w-px bg-border md:block" />
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="City or region in Greece"
                    className="h-14 border-0 pl-11 text-base focus-visible:ring-0"
                  />
                </div>
                <Button asChild size="lg" className="h-14 px-8 text-base font-semibold">
                  <Link to="/search">
                    <Search className="mr-2 h-5 w-5" /> Search
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Popular cities */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-white/80">
              <span className="font-medium">Popular destinations:</span>
              {cities.map((c) => (
                <a key={c} href="#" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">
                  {c}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b bg-card">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-4 py-8 md:grid-cols-3">
          {[
            { icon: Banknote, num: "Up to 70%", label: "Average savings vs UK / DE" },
            { icon: ShieldCheck, num: "EU", label: "Regulated clinics & patient rights" },
            { icon: Languages, num: "EN · DE · FR", label: "Doctors who speak your language" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{s.num}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Treatments */}
      <section id="treatments" className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Most-requested treatments</h2>
              <p className="mt-2 text-muted-foreground">Transparent pricing · no hidden fees · no obligation</p>
            </div>
            <Link
              to="/medical-tourism"
              className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
            >
              All treatments <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {treatments.map((t) => (
              <Card
                key={t.name}
                className="group cursor-pointer p-5 transition-all hover:-translate-y-1 hover:border-primary hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <t.icon className="h-6 w-6" />
                </div>
                <div className="font-semibold text-foreground">{t.name}</div>
                <div className="mt-1 text-sm font-medium text-success">{t.from}</div>
                <div className="text-xs text-muted-foreground">{t.note}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-muted/40 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">How it works</h2>
            <p className="mt-2 text-muted-foreground">From first message to recovery — we handle the logistics</p>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { icon: PhoneCall, step: "01", title: "Tell us what you need", desc: "Share your treatment, timing and any medical history through our short form." },
              { icon: ShieldCheck, step: "02", title: "Get matched with 3 doctors", desc: "Personalised quotes from JCI-certified clinics within 24 hours." },
              { icon: Hotel, step: "03", title: "Plan your trip", desc: "We book appointments, hotels, transfers and translation services for you." },
              { icon: Heart, step: "04", title: "Treatment & follow-up", desc: "Recover under our care with virtual follow-ups when you're back home." },
            ].map((s) => (
              <Card key={s.step} className="relative overflow-hidden p-8">
                <div className="absolute right-4 top-4 text-5xl font-bold text-accent">{s.step}</div>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <s.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg">
              <Link to="/medical-tourism#quote">
                Request my free quote <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Doctors directory — empty state */}
      <section id="doctors" className="py-16">
        <div className="container mx-auto px-4">
          <Card className="mx-auto max-w-3xl border-dashed p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
              <Stethoscope className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Our specialist network is being onboarded
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              We're matching patients with verified, English-speaking Greek doctors on a request basis.
              Tell us what treatment you need and we'll send you up to 3 personalised quotes within 24 hours.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/medical-tourism#quote">Request my free quote <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact"><UserPlus className="mr-2 h-4 w-4" /> Partner with us</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Why Greece */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge className="mb-3" variant="secondary">
                Why Greece
              </Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                Heal where the world comes to holiday
              </h2>
              <p className="mb-6 text-muted-foreground">
                Greek doctors train across Europe and the US. EU-regulated clinics meet the highest
                standards of safety. And after surgery, what better recovery room than a balcony
                overlooking the Aegean?
              </p>
              <ul className="space-y-3">
                {[
                  "EU healthcare regulations & patient rights",
                  "Direct flights from 80+ European cities",
                  "Mediterranean climate ideal for recovery",
                  "Dedicated patient coordinator from day one",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2 text-foreground/90">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" /> {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1533105079780-92b9be482077?w=500&h=600&fit=crop"
                alt="Santorini blue domes"
                loading="lazy"
                className="row-span-2 h-full rounded-2xl object-cover shadow-xl"
              />
              <img
                src="https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=500&h=300&fit=crop"
                alt="Doctor with tablet"
                loading="lazy"
                className="h-full rounded-2xl object-cover shadow-xl"
              />
              <img
                src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500&h=300&fit=crop"
                alt="Greek coast"
                loading="lazy"
                className="h-full rounded-2xl object-cover shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Patient guides</h2>
              <p className="mt-2 text-muted-foreground">Everything you need to plan your treatment abroad</p>
            </div>
            <Link
              to="/articles"
              className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
            >
              All guides <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {articles.map((a) => (
              <Card key={a.title} className="overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]">
                <img src={a.img} alt={a.title} loading="lazy" className="h-48 w-full object-cover" />
                <div className="p-5">
                  <Badge className="mb-2" variant="secondary">{a.tag}</Badge>
                  <h3 className="mb-2 font-semibold leading-snug text-foreground">{a.title}</h3>
                  <div className="text-xs text-muted-foreground">{a.read}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Big CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="overflow-hidden border-0" style={{ background: "var(--gradient-hero)" }}>
            <div className="grid items-center gap-8 p-10 md:grid-cols-2 lg:p-16">
              <div className="text-primary-foreground">
                <Badge className="mb-4 border-white/20 bg-white/10 text-white hover:bg-white/20">
                  Free · No obligation · 24h reply
                </Badge>
                <h2 className="mb-4 text-3xl font-bold leading-tight lg:text-4xl">
                  Get 3 personalised quotes from Greek specialists
                </h2>
                <p className="mb-6 text-white/90">
                  Tell us what you need and we'll match you with the right doctors in 24 hours. Travel,
                  hotel and translation included if you need them.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" variant="secondary" className="font-semibold">
                    <Link to="/medical-tourism#quote">Request my free quote</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link to="/medical-tourism">How it works</Link>
                  </Button>
                </div>
              </div>
              <div className="hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=700&h=600&fit=crop"
                  alt="Doctor consultation"
                  className="rounded-2xl shadow-2xl"
                  loading="lazy"
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">
                iatreia<span className="text-primary">.gr</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Greece's largest doctor & clinic directory — now serving international patients.
            </p>
          </div>
          {[
            { title: "Patients", links: ["How it works", "Treatments", "Clinics", "Patient guides", "FAQ"] },
            { title: "Doctors", links: ["Sign up", "Premium plans", "Claim profile", "Booking widget", "Verified Badge"] },
            { title: "Company", links: ["About us", "Contact", "Terms of use", "Privacy policy", "Greek (GR)"] },
          ].map((c) => (
            <div key={c.title}>
              <h4 className="mb-3 font-semibold text-foreground">{c.title}</h4>
              <ul className="space-y-2 text-sm">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-muted-foreground hover:text-primary">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t">
          <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-5 text-sm text-muted-foreground md:flex-row">
            <span>© {new Date().getFullYear()} iatreia.gr — All rights reserved.</span>
            <span>Made in Greece 🇬🇷</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IndexEn;
