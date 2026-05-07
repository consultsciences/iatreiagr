import { Apple, Smartphone, Bell, Calendar, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";

const AppDownload = () => (
  <section className="bg-muted/40 py-16">
    <div className="container mx-auto px-4">
      <Card className="overflow-hidden">
        <div className="grid items-center gap-8 p-10 md:grid-cols-2 lg:p-16">
          <div>
            <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">Mobile app</div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
              Κατέβασε το iatreia.gr στο κινητό σου
            </h2>
            <p className="mb-6 text-muted-foreground">
              Διαχειρίσου τα ραντεβού σου, λάβε υπενθυμίσεις και αποθήκευσε τις ιατρικές σου εξετάσεις σε ένα μέρος.
            </p>
            <ul className="mb-8 space-y-3">
              {[
                { icon: Calendar, label: "Όλα τα ραντεβού σου σε μια οθόνη" },
                { icon: Bell, label: "Έξυπνες υπενθυμίσεις πριν την επίσκεψη" },
                { icon: Heart, label: "Φάκελος υγείας σου & συνταγολόγιο" },
              ].map((f) => (
                <li key={f.label} className="flex items-center gap-3 text-foreground">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary">
                    <f.icon className="h-4 w-4" />
                  </div>
                  {f.label}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <a
                href="#"
                className="inline-flex items-center gap-3 rounded-xl bg-foreground px-5 py-3 text-background transition-transform hover:scale-[1.02]"
              >
                <Apple className="h-7 w-7" />
                <div className="text-left">
                  <div className="text-[10px] uppercase opacity-70">Download on the</div>
                  <div className="text-base font-semibold leading-tight">App Store</div>
                </div>
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-3 rounded-xl bg-foreground px-5 py-3 text-background transition-transform hover:scale-[1.02]"
              >
                <Smartphone className="h-7 w-7" />
                <div className="text-left">
                  <div className="text-[10px] uppercase opacity-70">Get it on</div>
                  <div className="text-base font-semibold leading-tight">Google Play</div>
                </div>
              </a>
            </div>
          </div>
          <div className="relative hidden justify-center md:flex">
            <div className="relative">
              <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-primary/20 to-transparent blur-3xl" />
              <img
                src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=700&fit=crop"
                alt="iatreia.gr mobile app preview"
                loading="lazy"
                className="relative w-64 rounded-[2.5rem] border-8 border-foreground/90 shadow-2xl"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  </section>
);

export default AppDownload;
