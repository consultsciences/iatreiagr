import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, MapPin, ArrowLeft, Loader2, SlidersHorizontal } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ListingCard } from "@/components/listings/ListingCard";
import { fetchListingsByQuery, type DbListing, CATEGORY_LABEL } from "@/lib/listings";

type Category = DbListing["category"] | "";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "", label: "Όλες οι κατηγορίες" },
  { value: "spaces", label: "Ιατρικοί Χώροι" },
  { value: "equipment", label: "Εξοπλισμός" },
  { value: "jobs", label: "Εργασία" },
  { value: "supplies", label: "Αναλώσιμα & Προμηθευτές" },
  { value: "services", label: "Υπηρεσίες" },
];

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQ = searchParams.get("q") ?? "";
  const initialCity = searchParams.get("city") ?? "";
  const initialCategory = (searchParams.get("category") ?? "") as Category;

  const [inputQ, setInputQ] = useState(initialQ);
  const [inputCity, setInputCity] = useState(initialCity);
  const [selectedCategory, setSelectedCategory] = useState<Category>(initialCategory);

  const [items, setItems] = useState<DbListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const activeQ = searchParams.get("q") ?? "";
  const activeCity = searchParams.get("city") ?? "";
  const activeCategory = (searchParams.get("category") ?? "") as Category;

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!activeQ && !activeCity && !activeCategory) {
      setItems([]);
      setSearched(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setSearched(true);

    fetchListingsByQuery({
      q: activeQ || undefined,
      city: activeCity || undefined,
      category: activeCategory || undefined,
      limit: 100,
    })
      .then((data) => {
        if (!controller.signal.aborted) setItems(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [activeQ, activeCity, activeCategory]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params: Record<string, string> = {};
    if (inputQ.trim()) params.q = inputQ.trim();
    if (inputCity.trim()) params.city = inputCity.trim();
    if (selectedCategory) params.category = selectedCategory;
    setSearchParams(params);
  }

  const grouped = useMemo(() => {
    const map = new Map<DbListing["category"], DbListing[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [items]);

  const displayCategory = activeCategory || "";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b py-10" style={{ background: "var(--gradient-soft)" }}>
        <div className="container mx-auto px-4">
          <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Αρχική
          </Link>
          <div className="mb-6 flex flex-wrap items-baseline gap-3">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {activeQ ? (
                <>Αποτελέσματα για "<span className="text-primary">{activeQ}</span>"</>
              ) : (
                "Αναζήτηση αγγελιών"
              )}
            </h1>
            {searched && !loading && (
              <span className="text-lg font-medium text-muted-foreground">
                {items.length} {items.length === 1 ? "αγγελία" : "αγγελίες"}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="p-2 shadow-[var(--shadow-elevated)]">
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="relative flex-1">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={inputQ}
                    onChange={(e) => setInputQ(e.target.value)}
                    placeholder="Τι ψάχνετε; (π.χ. οδοντιατρείο, υπερηχογράφος, νοσηλευτής)"
                    className="h-12 border-0 pl-11 text-base focus-visible:ring-0"
                  />
                </div>
                <div className="hidden w-px bg-border md:block" />
                <div className="relative md:w-52">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={inputCity}
                    onChange={(e) => setInputCity(e.target.value)}
                    placeholder="Πόλη"
                    className="h-12 border-0 pl-11 text-base focus-visible:ring-0"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-6 font-semibold">
                  <SearchIcon className="mr-2 h-4 w-4" /> Αναζήτηση
                </Button>
              </div>
            </Card>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            <SlidersHorizontal className="h-4 w-4 self-center text-muted-foreground" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value);
                  const params: Record<string, string> = {};
                  if (activeQ) params.q = activeQ;
                  if (activeCity) params.city = activeCity;
                  if (cat.value) params.category = cat.value;
                  setSearchParams(params);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  displayCategory === cat.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:border-primary hover:text-primary"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4">
          {!searched && !loading && (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <SearchIcon className="h-8 w-8" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">Αναζητήστε σε όλες τις κατηγορίες</h2>
              <p className="text-muted-foreground">
                Ιατρικοί χώροι, εξοπλισμός, θέσεις εργασίας, αναλώσιμα, υπηρεσίες — όλα σε μια αναζήτηση.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {searched && !loading && items.length === 0 && (
            <Card className="border-dashed p-10 text-center">
              <p className="font-semibold text-foreground">Δεν βρέθηκαν αγγελίες</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Δοκιμάστε διαφορετικές λέξεις-κλειδιά ή αφαιρέστε κάποιο φίλτρο.
              </p>
            </Card>
          )}

          {searched && !loading && items.length > 0 && (
            <>
              {displayCategory ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((l) => (
                    <ListingCard key={l.id} l={l} />
                  ))}
                </div>
              ) : (
                Array.from(grouped.entries()).map(([cat, listings]) => (
                  <div key={cat} className="mb-10">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">{CATEGORY_LABEL[cat]}</h2>
                        <Badge variant="secondary">{listings.length}</Badge>
                      </div>
                      <Link
                        to={`/${cat}${activeQ ? `?q=${encodeURIComponent(activeQ)}` : ""}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Δείτε όλες →
                      </Link>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {listings.slice(0, 6).map((l) => (
                        <ListingCard key={l.id} l={l} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default SearchPage;
