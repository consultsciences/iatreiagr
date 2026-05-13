import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2 } from "lucide-react";
import { getApiBase } from "@/lib/apiBase";

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => { document.title = "Επικοινωνία | iatreia.gr"; }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          subject: data.get("subject"),
          message: data.get("message"),
        }),
      });
      if (!res.ok) throw new Error("failed");
      setSent(true);
      form.reset();
    } catch {
      toast({ title: "Σφάλμα", description: "Δεν ήταν δυνατή η αποστολή. Δοκιμάστε πάλι ή επικοινωνήστε μέσω email.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

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
            {sent ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <CheckCircle2 className="h-14 w-14 text-green-500" />
                <h2 className="text-xl font-semibold">Το μήνυμά σας στάλθηκε!</h2>
                <p className="text-muted-foreground">Σας ευχαριστούμε. Θα επικοινωνήσουμε σύντομα.</p>
                <Button variant="outline" onClick={() => setSent(false)}>Νέο μήνυμα</Button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Όνομα</Label>
                    <Input id="name" name="name" required maxLength={100} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required maxLength={255} className="mt-1.5" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Θέμα</Label>
                  <Input id="subject" name="subject" required maxLength={150} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="message">Μήνυμα</Label>
                  <Textarea id="message" name="message" required maxLength={2000} rows={6} className="mt-1.5" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Τα προσωπικά σας δεδομένα χρησιμοποιούνται αποκλειστικά για την απάντηση στο
                  αίτημά σας, σύμφωνα με την{" "}
                  <a href="/privacy" className="underline underline-offset-2 hover:text-primary">Πολιτική Απορρήτου</a>{" "}
                  μας. Δεν τα κοινοποιούμε σε τρίτους.
                </p>
                <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Αποστολή…</> : "Αποστολή μηνύματος"}
                </Button>
              </form>
            )}
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
