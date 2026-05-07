import { Link } from "react-router-dom";
import { ArrowRight, Smile, Brain, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

const topics = [
  {
    icon: Smile,
    title: "Εμφυτεύματα δοντιών",
    desc: "Όλα όσα πρέπει να γνωρίζεις",
    href: "/articles/odontika-emfyteumata",
    tint: "from-primary/15 to-primary/5",
  },
  {
    icon: Brain,
    title: "Ψυχοθεραπεία Online",
    desc: "Πάρε τη βοήθεια που χρειάζεσαι όπου και αν είσαι",
    href: "/articles/online-psyxotherapeia",
    tint: "from-warning/20 to-warning/5",
  },
  {
    icon: Sparkles,
    title: "Life coaching",
    desc: "Τι είναι και πώς θα σε βοηθήσει",
    href: "/articles/life-coaching-odigos",
    tint: "from-success/20 to-success/5",
  },
];

const FeaturedTopics = () => (
  <section className="py-16">
    <div className="container mx-auto px-4">
      <div className="mb-10 max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Επιλεγμένα θέματα υγείας</h2>
        <p className="mt-2 text-muted-foreground">Οδηγοί από ειδικούς για τα πιο αναζητούμενα ζητήματα</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {topics.map((t) => (
          <Link key={t.title} to={t.href}>
            <Card className={`group relative overflow-hidden p-8 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)] bg-gradient-to-br ${t.tint}`}>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-card text-primary shadow-sm">
                <t.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">{t.title}</h3>
              <p className="mb-6 text-muted-foreground">{t.desc}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Μάθε περισσότερα <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturedTopics;
