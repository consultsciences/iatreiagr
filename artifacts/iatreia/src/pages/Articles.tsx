import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Calendar, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  read_time: string;
  created_at: string;
  image_url: string | null;
  author: string;
};

async function fetchArticles(): Promise<Article[]> {
  const res = await fetch(`${BASE_URL}/api/articles?limit=50`);
  if (!res.ok) throw new Error("Failed to fetch articles");
  const data = await res.json() as { articles: Article[] };
  return data.articles;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("el-GR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Όλα");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchArticles();
      setArticles(data);
    } catch {
      setError("Αδυναμία φόρτωσης άρθρων.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const categories = ["Όλα", ...Array.from(new Set(articles.map((a) => a.category)))];
  const filtered = activeCategory === "Όλα" ? articles : articles.filter((a) => a.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b py-14" style={{ background: "var(--gradient-soft)" }}>
        <div className="container mx-auto px-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="secondary" className="mb-3">
                <Sparkles className="mr-1 h-3 w-3" /> AI Νέα Υγείας
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Άρθρα & Νέα Υγείας</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Επίκαιρα άρθρα για επαγγελματίες υγείας — δημιουργημένα αυτόματα από AI με βάση τις τελευταίες ιατρικές εξελίξεις.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={load} className="mt-2 shrink-0">
              <RefreshCw className="mr-2 h-4 w-4" /> Ανανέωση
            </Button>
          </div>

          {articles.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeCategory === c
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Card className="border-dashed p-12 text-center">
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" className="mt-4" onClick={load}>Δοκιμάστε ξανά</Button>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed p-12 text-center">
              <Sparkles className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <p className="text-lg font-semibold">Δεν υπάρχουν άρθρα ακόμα</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Τα άρθρα δημιουργούνται αυτόματα από AI. Επιστρέψτε σύντομα.
              </p>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((a) => (
                <Link key={a.id} to={`/articles/${a.slug}`}>
                  <Card className="group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]">
                    <div className="aspect-[16/10] overflow-hidden bg-secondary">
                      {a.image_url ? (
                        <img
                          src={a.image_url}
                          alt={a.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Sparkles className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <Badge variant="secondary" className="mb-2 bg-accent text-accent-foreground hover:bg-accent">
                        {a.category}
                      </Badge>
                      <h3 className="line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary">
                        {a.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
                      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {a.read_time}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {formatDate(a.created_at)}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Articles;
