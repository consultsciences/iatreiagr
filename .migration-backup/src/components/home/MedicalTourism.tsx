import { Link } from "react-router-dom";
import { Plane, ShieldCheck, Banknote, Languages, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const perks = [
  { icon: Banknote, label: "Έως 70% χαμηλότερο κόστος από Β. Ευρώπη" },
  { icon: ShieldCheck, label: "JCI-πιστοποιημένες κλινικές" },
  { icon: Languages, label: "Αγγλόφωνο ιατρικό προσωπικό" },
];

const MedicalTourism = () => (
  <section className="py-16">
    <div className="container mx-auto px-4">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-foreground to-foreground/90">
        <div className="grid items-center gap-8 p-10 md:grid-cols-2 lg:p-16">
          <div className="text-background">
            <Badge className="mb-4 border-white/20 bg-white/10 text-white hover:bg-white/20">
              <Plane className="mr-1 h-3 w-3" /> Medical Tourism · Greece
            </Badge>
            <h2 className="mb-4 text-3xl font-bold leading-tight lg:text-4xl">
              World-class healthcare under the Greek sun
            </h2>
            <p className="mb-6 text-background/80">
              Combine premium dental, IVF, cosmetic and orthopaedic treatment with a holiday in Athens, Thessaloniki or
              the islands. We handle the doctor matching, scheduling and translation — you focus on getting better.
            </p>
            <ul className="mb-8 space-y-3">
              {perks.map((p) => (
                <li key={p.label} className="flex items-center gap-3 text-background/95">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                    <p.icon className="h-4 w-4" />
                  </div>
                  {p.label}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary" className="font-semibold">
                <Link to="/medical-tourism">
                  Get a free quote <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link to="/medical-tourism">How it works</Link>
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <img
              src="https://images.unsplash.com/photo-1533105079780-92b9be482077?w=700&h=600&fit=crop"
              alt="Santorini view representing medical tourism in Greece"
              loading="lazy"
              className="rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </Card>
    </div>
  </section>
);

export default MedicalTourism;
