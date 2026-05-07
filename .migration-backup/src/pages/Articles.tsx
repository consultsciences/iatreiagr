import { Link } from "react-router-dom";
import { Stethoscope, ArrowLeft, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { articles } from "@/data/articles";

const categories = ["Όλα", ...Array.from(new Set(articles.map((a) => a.category)))];

const Articles = () => {
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
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Αρχική
          </Link>
        </div>
      </header>

      <section className="border-b bg-muted/40 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Άρθρα υγείας</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Αξιόπιστο περιεχόμενο γραμμένο από πιστοποιημένους ιατρούς και ειδικούς υγείας.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                className="rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.slug} to={`/articles/${a.slug}`}>
                <Card className="group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={a.image}
                      alt={a.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <Badge variant="secondary" className="mb-2 bg-accent text-accent-foreground hover:bg-accent">
                      {a.category}
                    </Badge>
                    <h3 className="line-clamp-2 text-lg font-semibold text-foreground group-hover:text-primary">
                      {a.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {a.readTime}</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {a.date}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Articles;
