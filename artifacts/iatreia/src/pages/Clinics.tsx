import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Stethoscope,
  ArrowLeft,
  MapPin,
  Phone,
  BedDouble,
  Search,
  ExternalLink,
  X,
  Sparkles,
  Star,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { privateClinics } from "@/data/privateClinics";
import {
  compareClinicsByTier,
  getClinicPremium,
  getClinicTier,
  type ClinicTier,
} from "@/data/clinicPremium";

const TIER_BADGE: Record<
  Exclude<ClinicTier, "free">,
  { label: string; icon: typeof Sparkles; className: string }
> = {
  premium: {
    label: "Premium",
    icon: Sparkles,
    className:
      "border-transparent bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90",
  },
  featured: {
    label: "Προτεινόμενο",
    icon: Star,
    className:
      "border-transparent bg-primary/10 text-primary hover:bg-primary/15",
  },
  verified: {
    label: "Επαληθευμένο",
    icon: ShieldCheck,
    className:
      "border-transparent bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400",
  },
};

const PAGE_SIZE = 12;

// Curated specialty keywords found in the dataset's `departments` field.
const SPECIALTIES: { label: string; keywords: string[] }[] = [
  { label: "Παθολογικό", keywords: ["παθολογικ"] },
  { label: "Χειρουργικό", keywords: ["χειρουργικ"] },
  { label: "Καρδιολογικό", keywords: ["καρδιολογικ", "καρδιοχειρ"] },
  { label: "Μαιευτικό / Γυναικολογικό", keywords: ["μαιευτικ", "γυναικολογικ"] },
  { label: "Ορθοπεδικό", keywords: ["ορθοπ"] },
  { label: "Ψυχιατρικό", keywords: ["ψυχιατρικ", "νευροψυχ"] },
  { label: "Νευρολογικό", keywords: ["νευρολογικ"] },
  { label: "Παιδιατρικό", keywords: ["παιδιατρικ"] },
  { label: "Οφθαλμολογικό", keywords: ["οφθαλμ"] },
  { label: "ΩΡΛ", keywords: ["ωρλ", "ωτορινο"] },
  { label: "Ογκολογικό", keywords: ["ογκολογικ"] },
  { label: "Ουρολογικό", keywords: ["ουρολογικ"] },
  { label: "Αποκατάσταση", keywords: ["αποκαταστ", "φυσική ιατρ"] },
  { label: "ΜΕΘ", keywords: ["μεθ", "εντατικ"] },
];

const Clinics = () => {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [specialty, setSpecialty] = useState<string>("all");
  const [page, setPage] = useState(1);

  const regions = useMemo(() => {
    const set = new Set(privateClinics.map((c) => c.region).filter(Boolean));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const spec = SPECIALTIES.find((s) => s.label === specialty);
    return privateClinics.filter((c) => {
      if (region !== "all" && c.region !== region) return false;
      if (spec) {
        const dep = c.departments.toLowerCase();
        if (!spec.keywords.some((k) => dep.includes(k))) return false;
      }
      if (!term) return true;
      return (
        c.name.toLowerCase().includes(term) ||
        c.departments.toLowerCase().includes(term) ||
        c.address.toLowerCase().includes(term) ||
        c.regionalUnit.toLowerCase().includes(term)
      );
    }).sort((a, b) => compareClinicsByTier(a.id, b.id));
  }, [q, region, specialty]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  // Reset to page 1 whenever filters change.
  useEffect(() => {
    setPage(1);
  }, [q, region, specialty]);

  // Scroll to top on page change.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [safePage]);

  const hasActiveFilters = q || region !== "all" || specialty !== "all";

  const pageNumbers = useMemo(() => {
    const out: (number | "ellipsis")[] = [];
    const add = (n: number | "ellipsis") => out.push(n);
    const window = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= safePage - window && i <= safePage + window)
      ) {
        add(i);
      } else if (out[out.length - 1] !== "ellipsis") {
        add("ellipsis");
      }
    }
    return out;
  }, [totalPages, safePage]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              iatreia<span className="text-primary">.gr</span>
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Αρχική
          </Link>
        </div>
      </header>

      <section className="border-b bg-muted/40 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Ιδιωτικές κλινικές στην Ελλάδα
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Επίσημος κατάλογος {privateClinics.length} αδειοδοτημένων ιδιωτικών
            κλινικών, βασισμένος σε δημόσια δεδομένα του Υπουργείου Υγείας.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_minmax(0,16rem)_minmax(0,16rem)]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Αναζήτηση: όνομα κλινικής ή διεύθυνση…"
                className="pl-9"
              />
            </div>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Όλες οι περιφέρειες" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Όλες οι περιφέρειες</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger>
                <SelectValue placeholder="Όλες οι ειδικότητες" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Όλες οι ειδικότητες</SelectItem>
                {SPECIALTIES.map((s) => (
                  <SelectItem key={s.label} value={s.label}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{filtered.length} αποτελέσματα</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => {
                  setQ("");
                  setRegion("all");
                  setSpecialty("all");
                }}
              >
                <X className="h-3 w-3" /> Καθαρισμός φίλτρων
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-2">
            {pageItems.map((c) => {
              const tier = getClinicTier(c.id);
              const premium = getClinicPremium(c.id);
              const tierBadge = premium && !premium.badgeHidden ? TIER_BADGE[premium.tier] : null;
              const TierIcon = tierBadge?.icon;
              return (
              <Card
                key={c.id}
                className={
                  tier === "premium"
                    ? "relative overflow-hidden border-amber-500/40 p-5 shadow-md ring-1 ring-amber-500/20"
                    : tier === "featured"
                      ? "relative overflow-hidden border-primary/30 p-5"
                      : "p-5"
                }
              >
                {tierBadge && TierIcon && (
                  <Badge
                    className={`mb-2 inline-flex items-center gap-1 ${tierBadge.className}`}
                  >
                    <TierIcon className="h-3 w-3" />
                    {tierBadge.label}
                  </Badge>
                )}
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold leading-snug text-foreground">
                    {c.name}
                  </h3>
                  {c.type && (
                    <Badge
                      variant="secondary"
                      className="shrink-0 bg-accent text-accent-foreground hover:bg-accent"
                    >
                      {c.type}
                    </Badge>
                  )}
                </div>

                {premium?.tagline && (
                  <p className="mb-2 text-sm font-medium text-foreground/90">
                    {premium.tagline}
                  </p>
                )}

                {c.departments && (
                  <p className="mb-3 text-sm text-muted-foreground">
                    {c.departments}
                  </p>
                )}

                <div className="space-y-1.5 text-sm">
                  {c.address && (
                    <div className="flex items-start gap-2 text-foreground/80">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{c.address}</span>
                    </div>
                  )}
                  {c.phone && (
                    <a
                      href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      <span>{c.phone}</span>
                    </a>
                  )}
                  {c.beds && (
                    <div className="flex items-center gap-2 text-foreground/80">
                      <BedDouble className="h-4 w-4 text-primary" />
                      <span>{c.beds} κλίνες</span>
                    </div>
                  )}
                </div>

                {(c.region || c.regionalUnit) && (
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-3 text-xs text-muted-foreground">
                    {c.region && <span>Περιφέρεια {c.region}</span>}
                    {c.regionalUnit && <span>· Π.Ε. {c.regionalUnit}</span>}
                  </div>
                )}
              </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
              Δεν βρέθηκαν κλινικές με αυτά τα κριτήρια.
            </div>
          )}

          {totalPages > 1 && (
            <Pagination className="mt-10">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={safePage === 1}
                    className={
                      safePage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      if (safePage > 1) setPage(safePage - 1);
                    }}
                  />
                </PaginationItem>
                {pageNumbers.map((n, i) =>
                  n === "ellipsis" ? (
                    <PaginationItem key={`e-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={n}>
                      <PaginationLink
                        href="#"
                        isActive={n === safePage}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(n);
                        }}
                      >
                        {n}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={safePage === totalPages}
                    className={
                      safePage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      if (safePage < totalPages) setPage(safePage + 1);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          <p className="mt-10 text-xs text-muted-foreground">
            Πηγή δεδομένων:{" "}
            <a
              href="https://www.moh.gov.gr/articles/citizen/xrhsima-thlefwna-amp-dieythynseis/80-katastash-idiwtikwn-klinikwn-ths-xwras"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Υπουργείο Υγείας — Κατάσταση Ιδιωτικών Κλινικών της Χώρας
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Clinics;
