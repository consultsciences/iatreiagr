import { Building2, Target, Users, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const values = [
  { icon: Target, title: "Εστίαση στην υγεία", desc: "Δεν είμαστε γενική αγορά. Κάθε λειτουργία είναι σχεδιασμένη για ιατρούς, κλινικές και προμηθευτές." },
  { icon: ShieldCheck, title: "Διαφάνεια & ασφάλεια", desc: "Έλεγχος αγγελιών, επαλήθευση εταιρειών και σαφής πολιτική περιεχομένου." },
  { icon: Users, title: "Πραγματική σύνδεση", desc: "Δεν μεσολαβούμε σε συναλλαγές — διευκολύνουμε την απευθείας επικοινωνία μεταξύ επαγγελματιών." },
  { icon: Building2, title: "Ελληνική αγορά", desc: "Φτιαγμένο για το ρυθμιστικό, γλωσσικό και επιχειρηματικό πλαίσιο της Ελλάδας." },
];

const About = () => (
  <div className="min-h-screen bg-background">
    <SiteHeader />
    <section className="border-b py-16" style={{ background: "var(--gradient-soft)" }}>
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <Badge variant="secondary" className="mb-4">Σχετικά με εμάς</Badge>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Χτίζουμε την υποδομή της ελληνικής αγοράς υγείας.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Το iatreia.gr είναι η εξειδικευμένη B2B πλατφόρμα αγγελιών για επαγγελματίες υγείας στην Ελλάδα.
          Συνδέουμε όσους ζητούν με όσους προσφέρουν χώρο, εξοπλισμό, προσωπικό και υπηρεσίες.
        </p>
      </div>
    </section>

    <section className="py-16">
      <div className="container mx-auto grid gap-5 px-4 md:grid-cols-2 lg:grid-cols-4">
        {values.map((v) => (
          <Card key={v.title} className="p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <v.icon className="h-5 w-5" />
            </div>
            <h3 className="mb-2 font-semibold">{v.title}</h3>
            <p className="text-sm text-muted-foreground">{v.desc}</p>
          </Card>
        ))}
      </div>
    </section>

    <section className="border-t bg-secondary/40 py-16">
      <div className="container mx-auto max-w-3xl px-4">
        <h2 className="mb-4 text-2xl font-bold md:text-3xl">Η αποστολή μας</h2>
        <p className="text-muted-foreground">
          Πιστεύουμε ότι κάθε επαγγελματίας υγείας στην Ελλάδα αξίζει γρήγορη, διαφανή και αξιόπιστη
          πρόσβαση στα εργαλεία που χρειάζεται για να ασκήσει το επάγγελμά του. Από τον νέο ιατρό που
          ψάχνει το πρώτο του ιατρείο, μέχρι τον διανομέα που θέλει να φτάσει σε χιλιάδες κλινικές —
          είμαστε εδώ για να μειώσουμε τον χρόνο, το κόστος και την πολυπλοκότητα.
        </p>
      </div>
    </section>
    <SiteFooter />
  </div>
);

export default About;
