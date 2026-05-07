import { useState } from "react";
import { Link } from "react-router-dom";
import { Stethoscope, ArrowLeft, Lock, MessageCircleQuestion, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const specialties = [
  "Γενικός ιατρός",
  "Δερματολόγος",
  "Παιδίατρος",
  "Ψυχολόγος",
  "Καρδιολόγος",
  "Ορθοπεδικός",
  "Γυναικολόγος",
  "Ωτορινολαρυγγολόγος",
];


const Ask = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Η ερώτησή σου εστάλη ανώνυμα.");
  };

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
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <MessageCircleQuestion className="h-7 w-7" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Ρώτα τους ειδικούς μας</h1>
          <p className="mt-3 text-muted-foreground">
            Κάνε την ερώτησή σου ανώνυμα και πάρε αξιόπιστες απαντήσεις από πιστοποιημένους ιατρούς εντός 24 ωρών.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[1fr_1.2fr]">
          <Card className="h-fit p-6">
            {submitted ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 className="mb-3 h-14 w-14 text-success" />
                <h3 className="text-xl font-bold text-foreground">Η ερώτηση δημοσιεύτηκε</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Θα σε ειδοποιήσουμε με email όταν ένας ειδικός απαντήσει.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>
                  Κάνε νέα ερώτηση
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                  <Lock className="h-3 w-3" /> 100% ανώνυμα
                </div>
                <div>
                  <Label htmlFor="spec">Ειδικότητα</Label>
                  <Select>
                    <SelectTrigger id="spec" className="mt-1">
                      <SelectValue placeholder="Επίλεξε ειδικότητα" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="q">Η ερώτησή σου</Label>
                  <Textarea
                    id="q"
                    required
                    rows={6}
                    className="mt-1"
                    placeholder="Περίγραψε τα συμπτώματα ή την απορία σου με όσες λεπτομέρειες θες…"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  Δημοσίευση ερώτησης
                </Button>
              </form>
            )}
          </Card>

          <div>
            <h2 className="mb-4 text-xl font-bold text-foreground">Πρόσφατες ερωτήσεις</h2>
            <Card className="border-dashed p-8 text-center">
              <MessageCircleQuestion className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium text-foreground">Δεν υπάρχουν ακόμη δημοσιευμένες ερωτήσεις.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Γίνε ο πρώτος που θα ρωτήσει — η απάντηση θα εμφανιστεί εδώ.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Ask;
