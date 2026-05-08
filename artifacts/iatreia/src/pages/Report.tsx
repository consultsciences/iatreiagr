import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

const REASONS = [
  { value: "misleading", label: "Παραπλανητικές ή ψευδείς πληροφορίες" },
  { value: "wrong_category", label: "Λάθος κατηγορία / άσχετο με υγεία" },
  { value: "counterfeit", label: "Παράνομα ή πλαστά προϊόντα" },
  { value: "spam", label: "Spam / διπλότυπη αγγελία" },
  { value: "ip_violation", label: "Παραβίαση πνευματικών δικαιωμάτων" },
  { value: "personal_data", label: "Διαρροή προσωπικών δεδομένων" },
  { value: "offensive", label: "Προσβλητικό ή ακατάλληλο περιεχόμενο" },
  { value: "other", label: "Άλλος λόγος" },
];

const Report = () => {
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [reason, setReason] = useState("");

  const prefillSlug = params.get("slug") ?? "";

  useEffect(() => { document.title = "Αναφορά Αγγελίας | iatreia.gr"; }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    toast({
      title: "Η αναφορά σας ελήφθη",
      description: "Η ομάδα μας θα εξετάσει την καταγγελία το συντομότερο δυνατό.",
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <section className="flex min-h-[60vh] items-center justify-center py-16">
          <div className="mx-auto max-w-md px-4 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mb-3 text-2xl font-bold">Αναφορά Υποβλήθηκε</h1>
            <p className="mb-6 text-muted-foreground">
              Σας ευχαριστούμε. Η ομάδα διαχείρισης της iatreia.gr θα εξετάσει την καταγγελία σας
              και θα λάβει τα κατάλληλα μέτρα εντός 2 εργάσιμων ημερών.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button asChild variant="outline">
                <Link to="/">Επιστροφή στην αρχική</Link>
              </Button>
              <Button asChild>
                <Link to="/contact">Επικοινωνία</Link>
              </Button>
            </div>
          </div>
        </section>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b py-12" style={{ background: "var(--gradient-soft)" }}>
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <Badge variant="secondary" className="mb-4">Καταγγελία</Badge>
          <h1 className="text-4xl font-bold tracking-tight">Αναφορά Αγγελίας</h1>
          <p className="mt-3 text-muted-foreground">
            Εντοπίσατε αγγελία που παραβιάζει τους κανόνες μας; Ενημερώστε μας και θα τη
            διερευνήσουμε άμεσα.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[1.5fr_1fr] max-w-5xl">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="listing_url">URL ή τίτλος αγγελίας</Label>
                <Input
                  id="listing_url"
                  required
                  maxLength={500}
                  defaultValue={prefillSlug ? `${window.location.origin}/listing/${prefillSlug}` : ""}
                  placeholder="πχ. https://iatreia.gr/listing/iatreio-kentro-athinas"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="reason">Λόγος αναφοράς</Label>
                <Select onValueChange={setReason} required>
                  <SelectTrigger id="reason" className="mt-1.5">
                    <SelectValue placeholder="Επιλέξτε λόγο…" />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reporter_email">Το email σας (προαιρετικό)</Label>
                <Input
                  id="reporter_email"
                  type="email"
                  maxLength={255}
                  placeholder="Για να σας ενημερώσουμε σχετικά με την έκβαση"
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Τα στοιχεία επικοινωνίας χρησιμοποιούνται αποκλειστικά για την αντιμετώπιση της
                  καταγγελίας, σύμφωνα με την{" "}
                  <Link to="/privacy" className="underline underline-offset-2">Πολιτική Απορρήτου</Link>.
                </p>
              </div>

              <div>
                <Label htmlFor="description">Περιγραφή προβλήματος</Label>
                <Textarea
                  id="description"
                  required
                  maxLength={2000}
                  rows={5}
                  placeholder="Περιγράψτε συνοπτικά γιατί θεωρείτε ότι η αγγελία παραβιάζει τους κανόνες μας…"
                  className="mt-1.5"
                />
              </div>

              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                Υποβάλλοντας αυτή τη φόρμα δηλώνετε ότι η αναφορά σας είναι εμπιστευτική,
                ακριβής και καλόπιστη. Κατάχρηση της διαδικασίας καταγγελίας ενδέχεται να
                οδηγήσει σε αναστολή λογαριασμού.
              </div>

              <Button type="submit" size="lg" disabled={!reason}>
                Υποβολή Αναφοράς
              </Button>
            </form>
          </Card>

          <div className="space-y-4 text-sm">
            <div className="rounded-lg border bg-card p-5">
              <h3 className="mb-2 font-semibold">Τι ελέγχουμε</h3>
              <ul className="space-y-1.5 text-muted-foreground">
                {REASONS.map((r) => (
                  <li key={r.value} className="flex items-start gap-2">
                    <span className="mt-0.5 text-primary">•</span>
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border bg-card p-5">
              <h3 className="mb-2 font-semibold">Χρόνος Απόκρισης</h3>
              <p className="text-muted-foreground">
                Εξετάζουμε κάθε αναφορά εντός{" "}
                <strong>2 εργάσιμων ημερών</strong>. Σοβαρές παραβιάσεις αντιμετωπίζονται
                άμεσα.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-5">
              <h3 className="mb-2 font-semibold">Άλλο πρόβλημα;</h3>
              <p className="text-muted-foreground">
                Για γενικά ερωτήματα ή παράπονα χρησιμοποιήστε τη{" "}
                <Link to="/contact" className="text-primary underline-offset-2 hover:underline">
                  φόρμα επικοινωνίας
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
};

export default Report;
