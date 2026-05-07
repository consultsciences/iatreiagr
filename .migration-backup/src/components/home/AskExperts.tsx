import { Link } from "react-router-dom";
import { MessageCircleQuestion, Lock, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  { icon: Lock, title: "100% ανώνυμα", desc: "Κανένα όνομα, κανένα email στην ερώτησή σου." },
  { icon: ShieldCheck, title: "Πιστοποιημένοι ιατροί", desc: "Απαντούν μόνο επαληθευμένοι επαγγελματίες." },
  { icon: Clock, title: "Απάντηση εντός 24h", desc: "Ειδοποίηση με email μόλις απαντήσει ειδικός." },
];

const AskExperts = () => (
  <section className="py-16">
    <div className="container mx-auto px-4">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <MessageCircleQuestion className="h-3.5 w-3.5" /> Ρώτα τους ειδικούς
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
            Ένας ασφαλής χώρος για τις απορίες σου
          </h2>
          <p className="mb-6 text-muted-foreground">
            Κάνε την ερώτησή σου <span className="inline-flex items-center gap-1 font-semibold text-foreground"><Lock className="h-3.5 w-3.5" /> ανώνυμα</span> και πάρε αξιόπιστες απαντήσεις από πιστοποιημένους ιατρούς.
          </p>
          <Button asChild size="lg">
            <Link to="/ask">Κάνε την ερώτησή σου</Link>
          </Button>
        </div>
        <div className="space-y-3">
          {features.map((f) => (
            <Card key={f.title} className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{f.title}</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">{f.desc}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default AskExperts;
