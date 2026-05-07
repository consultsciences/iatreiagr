import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, Stethoscope, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { articles } from "@/data/articles";

const ArticleDetail = () => {
  const { slug } = useParams();
  const article = articles.find((a) => a.slug === slug);
  if (!article) return <Navigate to="/articles" replace />;

  const related = articles.filter((a) => a.slug !== article.slug && a.category === article.category).slice(0, 3);

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
          <Link to="/articles" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Όλα τα άρθρα
          </Link>
        </div>
      </header>

      <article className="container mx-auto max-w-3xl px-4 py-12">
        <Badge className="mb-4">{article.category}</Badge>
        <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl">{article.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1"><User className="h-4 w-4" /> {article.author}</span>
          <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> {article.date}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {article.readTime}</span>
        </div>

        <img
          src={article.image}
          alt={article.title}
          className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover shadow-[var(--shadow-card)]"
        />

        <div className="prose prose-lg mt-8 max-w-none text-foreground">
          {article.content.map((p, i) => (
            <p key={i} className="mb-5 text-lg leading-relaxed text-foreground/90">
              {p}
            </p>
          ))}
        </div>

        {related.length > 0 && (
          <div className="mt-16 border-t pt-12">
            <h2 className="mb-6 text-2xl font-bold text-foreground">Σχετικά άρθρα</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link key={r.slug} to={`/articles/${r.slug}`}>
                  <Card className="h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
                    <img src={r.image} alt={r.title} className="h-32 w-full object-cover" loading="lazy" />
                    <div className="p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{r.title}</h3>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};

export default ArticleDetail;
