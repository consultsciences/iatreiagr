import { Link } from "react-router-dom";
import { Headphones, Play, BookOpen, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const items = [
  {
    icon: Headphones,
    label: "Άκου",
    title: "Podcasts",
    desc: "Συζητήσεις με κορυφαίους ειδικούς υγείας",
    href: "#",
    bg: "bg-gradient-to-br from-primary to-primary-glow",
  },
  {
    icon: Play,
    label: "Δες",
    title: "Vidcasts",
    desc: "Σύντομα βίντεο για κρίσιμα θέματα",
    href: "#",
    bg: "bg-gradient-to-br from-warning to-warning/70",
  },
  {
    icon: BookOpen,
    label: "Διάβασε",
    title: "Άρθρα",
    desc: "Οδηγοί, συμβουλές & νέα της υγείας",
    href: "/articles",
    bg: "bg-gradient-to-br from-success to-success/70",
  },
];

const WellnessHub = () => (
  <section className="bg-muted/40 py-16">
    <div className="container mx-auto px-4">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Το κέντρο ευεξίας σου</div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Ξεκίνα το ταξίδι σου για μια πιο χαρούμενη ζωή</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((it) => (
          <Link key={it.title} to={it.href}>
            <Card className={`group relative h-64 overflow-hidden border-0 p-8 text-primary-foreground transition-transform hover:-translate-y-1 ${it.bg}`}>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                <it.icon className="h-6 w-6" />
              </div>
              <div className="text-sm font-medium uppercase tracking-wider opacity-80">{it.label}</div>
              <h3 className="mb-2 text-3xl font-bold">{it.title}</h3>
              <p className="text-sm opacity-90">{it.desc}</p>
              <ArrowRight className="absolute bottom-6 right-6 h-6 w-6 transition-transform group-hover:translate-x-1" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default WellnessHub;
