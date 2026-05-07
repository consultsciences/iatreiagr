import { Link } from "react-router-dom";
import { Building2, ArrowRight, MapPin, BedDouble } from "lucide-react";
import { Card } from "@/components/ui/card";
import { privateClinics } from "@/data/privateClinics";

const ClinicsDirectory = () => {
  const totalClinics = privateClinics.length;
  const totalBeds = privateClinics.reduce((sum, c) => {
    const n = parseInt(c.beds, 10);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
  const regions = new Set(privateClinics.map((c) => c.region).filter(Boolean)).size;

  const featured = privateClinics
    .filter((c) => c.name && c.address)
    .slice(0, 4);

  return (
    <section className="bg-muted/30 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Building2 className="h-3.5 w-3.5" /> Δημόσια δεδομένα · Υπουργείο Υγείας
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Κατάλογος ιδιωτικών κλινικών στην Ελλάδα
            </h2>
            <p className="mt-2 text-muted-foreground">
              Πλήρης λίστα {totalClinics} αδειοδοτημένων ιδιωτικών κλινικών —
              {" "}{totalBeds.toLocaleString("el-GR")}+ κλίνες σε {regions} περιφέρειες.
            </p>
          </div>
          <Link
            to="/clinics"
            className="inline-flex items-center gap-1 self-start text-sm font-semibold text-primary hover:underline md:self-auto"
          >
            Δες όλες τις κλινικές <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((c) => (
            <Link key={c.id} to="/clinics" className="block">
              <Card className="group h-full p-5 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
                  {c.name}
                </h3>
                {c.departments && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.departments}</p>
                )}
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {c.regionalUnit && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{c.regionalUnit}</span>
                    </div>
                  )}
                  {c.beds && (
                    <div className="flex items-center gap-1.5">
                      <BedDouble className="h-3.5 w-3.5" />
                      <span>{c.beds} κλίνες</span>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClinicsDirectory;
