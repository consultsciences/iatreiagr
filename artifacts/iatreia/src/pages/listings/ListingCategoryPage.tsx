import { useEffect, useMemo, useState } from "react";
import { Search, MapPin, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ListingCard } from "@/components/listings/ListingCard";
import { fetchListingsByCategory, type DbListing } from "@/lib/listings";

interface Props {
  category: DbListing["category"];
  title: string;
  subtitle: string;
  disclaimer: string;
}

export const ListingCategoryPage = ({ category, title, subtitle, disclaimer }: Props) => {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [items, setItems] = useState<DbListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchListingsByCategory(category)
      .then((data) => active && setItems(data))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [category]);

  const filtered = useMemo(
    () =>
      items
        .filter((l) =>
          q ? `${l.title} ${l.city} ${l.meta ?? ""}`.toLowerCase().includes(q.toLowerCase()) : true,
        )
        .filter((l) => (city ? (l.city ?? "").toLowerCase().includes(city.toLowerCase()) : true)),
    [items, q, city],
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b py-12" style={{ background: "var(--gradient-soft)" }}>
        <div className="container mx-auto px-4">
          <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Αρχική
          </Link>
          <Badge variant="secondary" className="mb-3">Κατηγορία</Badge>
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
            {!loading && (
              <span className="text-lg font-medium text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "αγγελία" : "αγγελίες"}
              </span>
            )}
            {loading && (
              <span className="text-lg text-muted-foreground opacity-60">…</span>
            )}
          </div>
          <p className="mt-3 max-w-2xl text-muted-foreground">{subtitle}</p>

          <Card className="mt-6 p-2">
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Αναζήτηση εντός κατηγορίας..."
                  className="h-12 border-0 pl-11 focus-visible:ring-0"
                />
              </div>
              <div className="relative md:w-52">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Πόλη"
                  className="h-12 border-0 pl-11 focus-visible:ring-0"
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="mb-5 text-sm text-muted-foreground">
            {loading ? "Φόρτωση…" : `${filtered.length} ${filtered.length === 1 ? "αγγελία" : "αγγελίες"}`}
          </div>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed p-10 text-center">
              <p className="text-muted-foreground">Δεν βρέθηκαν αγγελίες με αυτά τα κριτήρια.</p>
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((l) => (
                <ListingCard key={l.id} l={l} />
              ))}
            </div>
          )}

          <Card className="mt-10 border-l-4 border-l-accent bg-accent/5 p-5 text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Σημείωση: </strong>
            {disclaimer}
          </Card>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
};
