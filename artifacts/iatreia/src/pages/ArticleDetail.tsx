import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, User, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  read_time: string;
  created_at: string;
  image_url: string | null;
  author: string;
};

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

const ArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    const fetchArticle = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/articles/${slug}`);
        if (res.status === 404) {
          navigate("/articles", { replace: true });
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json() as Article;
        setArticle(data);

        const relRes = await fetch(`${BASE_URL}/api/articles?limit=20`);
        if (relRes.ok) {
          const relData = await relRes.json() as { articles: Article[] };
          setRelatedArticles(
            relData.articles
              .filter((a) => a.slug !== slug && a.category === data.category)
              .slice(0, 3)
          );
        }
      } catch {
        navigate("/articles", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    void fetchArticle();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!article) return null;

  const paragraphs = article.content.split(/\n\n+/).filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="border-b bg-secondary/30 py-3">
        <div className="container mx-auto px-4">
          <Link
            to="/articles"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Όλα τα άρθρα
          </Link>
        </div>
      </div>

      <article className="container mx-auto max-w-3xl px-4 py-12">
        <Badge className="mb-4">{article.category}</Badge>
        <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
          {article.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <User className="h-4 w-4" /> {article.author}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-4 w-4" /> {formatDate(article.created_at)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" /> {article.read_time}
          </span>
          <span className="inline-flex items-center gap-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Δημιουργήθηκε από AI
          </span>
        </div>

        {article.image_url && (
          <img
            src={article.image_url}
            alt={article.title}
            className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover shadow-[var(--shadow-card)]"
          />
        )}

        <div className="mt-8 space-y-5">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-lg leading-relaxed text-foreground/90">
              {p}
            </p>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm text-muted-foreground">
          <Sparkles className="mb-1 inline h-4 w-4 text-accent" />{" "}
          Αυτό το άρθρο δημιουργήθηκε αυτόματα από AI με βάση τις τελευταίες ιατρικές εξελίξεις. Δεν αποτελεί ιατρική συμβουλή.
        </div>

        {relatedArticles.length > 0 && (
          <div className="mt-16 border-t pt-12">
            <h2 className="mb-6 text-2xl font-bold text-foreground">Σχετικά άρθρα</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedArticles.map((r) => (
                <Link key={r.slug} to={`/articles/${r.slug}`}>
                  <Card className="h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
                    {r.image_url && (
                      <img
                        src={r.image_url}
                        alt={r.title}
                        className="h-32 w-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="p-4">
                      <Badge variant="secondary" className="mb-1 text-xs">{r.category}</Badge>
                      <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{r.title}</h3>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      <SiteFooter />
    </div>
  );
};

export default ArticleDetail;
