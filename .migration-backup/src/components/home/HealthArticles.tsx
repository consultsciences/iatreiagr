import { Link } from "react-router-dom";
import { ChevronRight, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { articles } from "@/data/articles";

const HealthArticles = () => {
  const featured = articles.slice(0, 4);
  return (
    <section className="bg-muted/40 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Άρθρα υγείας</h2>
            <p className="mt-2 text-muted-foreground">Αξιόπιστο περιεχόμενο γραμμένο από πιστοποιημένους ιατρούς</p>
          </div>
          <Link to="/articles" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex">
            Όλα τα άρθρα <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((a) => (
            <Link key={a.slug} to={`/articles/${a.slug}`}>
              <Card className="group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]">
                <div className="aspect-[4/3] overflow-hidden">
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
                  <h3 className="line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary">
                    {a.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {a.readTime} · {a.date}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HealthArticles;
