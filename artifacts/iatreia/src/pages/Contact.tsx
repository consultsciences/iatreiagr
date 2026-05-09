import { useEffect } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();

  useEffect(() => { document.title = "Επικοινωνία | iatreia.gr"; }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b py-14" style={{ background: "var(--gradient-soft)" }}>
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <Badge variant="secondary" className="mb-4">Επικοινωνία</Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Πώς μπορούμε να βοηθήσουμε;</h1>
          <p className="mt-4 text-muted-foreground">
            Στείλτε μας μήνυμα και θα επικοινωνήσουμε μαζί σας.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="container mx-auto max-w-2xl px-4">
          <Card className="p-6 md:p-8">
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                toast({ title: "Το μήνυμα στάλθηκε", description: "Σας ευχαριστούμε. Θα επικοινωνήσουμε σύντομα." });
                (e.target as HTMLFormElement).reset();
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Όνομα</Label>
                  <Input id="name" required maxLength={100} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required maxLength={255} className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label htmlFor="subject">Θέμα</Label>
                <Input id="subject" required maxLength={150} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="message">Μήνυμα</Label>
                <Textarea id="message" required maxLength={2000} rows={6} className="mt-1.5" />
              </div>
              <p className="text-xs text-muted-foreground">
                Τα προσωπικά σας δεδομένα χρησιμοποιούνται αποκλειστικά για την απάντηση στο
                αίτημά σας, σύμφωνα με την{" "}
                <a href="/privacy" className="underline underline-offset-2 hover:text-primary">Πολιτική Απορρήτου</a>{" "}
                μας. Δεν τα κοινοποιούμε σε τρίτους.
              </p>
              <Button type="submit" size="lg" className="w-full sm:w-auto">Αποστολή μηνύματος</Button>
            </form>
          </Card>

          <div className="mt-8 rounded-lg border bg-muted/40 px-6 py-5 text-sm text-muted-foreground">
            <p>
              Η πλατφόρμα <strong className="text-foreground">iatreia.gr</strong> λειτουργεί από
              την <strong className="text-foreground">Consult Sciences Ltd</strong>, εταιρεία
              εγγεγραμμένη στην Αγγλία και στην Ουαλία, με έδρα στο Λονδίνο,
              Ηνωμένο Βασίλειο.
            </p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
};

export default Contact;
