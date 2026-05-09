import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle2,
  ArrowRight,
  Globe,
  FileText,
  Phone,
  Star,
  XCircle,
  Building2,
  Stethoscope,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type PlacementType = "services" | "clinic-launch";

interface FormState {
  title: string;
  description: string;
  proposal: string;
  city: string;
  region: string;
  website_url: string;
  logo_url: string;
  image_url: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
}

const empty: FormState = {
  title: "",
  description: "",
  proposal: "",
  city: "",
  region: "",
  website_url: "",
  logo_url: "",
  image_url: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
};

function validate(form: FormState): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!form.title.trim() || form.title.trim().length < 3)
    errs.title = "Ο τίτλος πρέπει να έχει τουλάχιστον 3 χαρακτήρες";
  if (form.website_url && !/^https?:\/\/.+/.test(form.website_url))
    errs.website_url = "Μη έγκυρο URL (πρέπει να ξεκινά με http:// ή https://)";
  if (form.logo_url && !/^https?:\/\/.+/.test(form.logo_url))
    errs.logo_url = "Μη έγκυρο URL εικόνας";
  if (form.image_url && !/^https?:\/\/.+/.test(form.image_url))
    errs.image_url = "Μη έγκυρο URL εικόνας";
  if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email))
    errs.contact_email = "Μη έγκυρο email";
  return errs;
}

const WHAT_YOU_GET = [
  "Αφιερωμένη σελίδα καταχώρισης με το brand σας",
  "Πλήρης περιγραφή & πρόταση συνεργασίας",
  "Φόρμα επικοινωνίας άμεσα με εσάς",
  "Logo, website link & στοιχεία επικοινωνίας",
  "Εμφάνιση σε αποτελέσματα αναζήτησης",
  "Featured badge στην κατηγορία σας",
  "Απεριόριστη διάρκεια ανάρτησης",
];

const PlacementOrder = () => {
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { session } = useClerk();
  const navigate = useNavigate();
  const [placementType, setPlacementType] = useState<PlacementType>(
    (searchParams.get("type") as PlacementType) || "services"
  );
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const checkoutStatus = searchParams.get("checkout");

  useEffect(() => {
    document.title = "Premium Placement — iatreia.gr";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/advertise&tab=signin`, { replace: true });
    }
  }, [user, authLoading, navigate]);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (!user) return;

    setSubmitting(true);
    try {
      const token = await session?.getToken();
      if (!token) throw new Error("Δεν βρέθηκε session.");

      const res = await fetch(`${BASE}/api/stripe/placement-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          placement_type: placementType,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          proposal: form.proposal.trim() || undefined,
          city: form.city.trim() || undefined,
          region: form.region.trim() || undefined,
          website_url: form.website_url.trim() || undefined,
          logo_url: form.logo_url.trim() || undefined,
          image_url: form.image_url.trim() || undefined,
          contact_name: form.contact_name.trim() || undefined,
          contact_email: form.contact_email.trim() || undefined,
          contact_phone: form.contact_phone.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Αποτυχία δημιουργίας πληρωμής");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err: unknown) {
      toast({
        title: "Σφάλμα",
        description: err instanceof Error ? err.message : "Αποτυχία. Δοκιμάστε ξανά.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      {checkoutStatus === "cancel" && (
        <div className="border-b bg-destructive/5 px-4 py-3 text-center text-sm text-destructive">
          <XCircle className="mr-2 inline h-4 w-4" />
          Η πληρωμή ακυρώθηκε. Μπορείτε να δοκιμάσετε ξανά.
        </div>
      )}

      <section className="border-b py-12" style={{ background: "var(--gradient-soft)" }}>
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <Badge variant="secondary" className="mb-4">Premium Placement</Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Αποκτήστε τη δική σας σελίδα στο iatreia.gr
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Μία εφάπαξ καταχώριση €1.499 — απεριόριστης διάρκειας — με αφιερωμένη σελίδα,
            φόρμα επικοινωνίας και featured badge στο μεγαλύτερο B2B medical marketplace της Ελλάδας.
          </p>
          <div className="mt-6 inline-flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-primary">€1.499</span>
            <span className="text-muted-foreground">εφάπαξ</span>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <div>
                <h2 className="mb-4 text-xl font-bold">Τύπος Καταχώρισης</h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPlacementType("services")}
                    className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 text-left transition-all ${
                      placementType === "services"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <Stethoscope className={`h-8 w-8 ${placementType === "services" ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <div className="font-semibold">Υπηρεσία / Συνεργάτης</div>
                      <div className="text-xs text-muted-foreground">Νομικοί, λογιστές, leasing, κατασκευή, ΙΤ κ.ά.</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlacementType("clinic-launch")}
                    className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 text-left transition-all ${
                      placementType === "clinic-launch"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <Building2 className={`h-8 w-8 ${placementType === "clinic-launch" ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <div className="font-semibold">Άνοιγμα Ιατρείου</div>
                      <div className="text-xs text-muted-foreground">Πακέτα setup, εξοπλισμός, αδειοδότηση κ.ά.</div>
                    </div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Βασικά στοιχεία</CardTitle>
                    <CardDescription>Τίτλος, περιγραφή και πρόταση συνεργασίας</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="title">Επωνυμία / Τίτλος <span className="text-destructive">*</span></Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={set("title")}
                        placeholder="π.χ. Νομική Εταιρεία Παπαδόπουλος & Συνεργάτες"
                        className={errors.title ? "border-destructive" : ""}
                      />
                      {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="description">Σύντομη περιγραφή</Label>
                      <Textarea
                        id="description"
                        value={form.description}
                        onChange={set("description")}
                        placeholder="Περιγράψτε σε 2-3 προτάσεις τι προσφέρετε…"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="proposal">
                        <FileText className="mr-1.5 inline h-4 w-4 text-primary" />
                        Πρόταση Συνεργασίας
                      </Label>
                      <Textarea
                        id="proposal"
                        value={form.proposal}
                        onChange={set("proposal")}
                        placeholder="Αναπτύξτε αναλυτικά τι κάνετε, ποιους εξυπηρετείτε, τι διαφοροποιεί την υπηρεσία σας…"
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Αυτή η ενότητα εμφανίζεται επιδεικτικά στην αφιερωμένη σελίδα σας.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Τοποθεσία & Online παρουσία</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="city">Πόλη</Label>
                        <Input id="city" value={form.city} onChange={set("city")} placeholder="π.χ. Αθήνα" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="region">Περιοχή / Νομός</Label>
                        <Input id="region" value={form.region} onChange={set("region")} placeholder="π.χ. Αττική" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="website_url">
                        <Globe className="mr-1.5 inline h-4 w-4" />
                        Website
                      </Label>
                      <Input
                        id="website_url"
                        value={form.website_url}
                        onChange={set("website_url")}
                        placeholder="https://www.example.gr"
                        className={errors.website_url ? "border-destructive" : ""}
                      />
                      {errors.website_url && <p className="text-xs text-destructive">{errors.website_url}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="logo_url">URL Logo εταιρείας</Label>
                      <Input
                        id="logo_url"
                        value={form.logo_url}
                        onChange={set("logo_url")}
                        placeholder="https://…/logo.png"
                        className={errors.logo_url ? "border-destructive" : ""}
                      />
                      {errors.logo_url && <p className="text-xs text-destructive">{errors.logo_url}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="image_url">URL φωτογραφίας / banner</Label>
                      <Input
                        id="image_url"
                        value={form.image_url}
                        onChange={set("image_url")}
                        placeholder="https://…/photo.jpg"
                        className={errors.image_url ? "border-destructive" : ""}
                      />
                      {errors.image_url && <p className="text-xs text-destructive">{errors.image_url}</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Στοιχεία Επικοινωνίας</CardTitle>
                    <CardDescription>Εμφανίζονται στη σελίδα σας για άμεση επαφή</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact_name">Ονοματεπώνυμο / Υπεύθυνος</Label>
                      <Input id="contact_name" value={form.contact_name} onChange={set("contact_name")} placeholder="π.χ. Γιώργος Παπαδόπουλος" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="contact_email">Email</Label>
                        <Input
                          id="contact_email"
                          type="email"
                          value={form.contact_email}
                          onChange={set("contact_email")}
                          placeholder="info@example.gr"
                          className={errors.contact_email ? "border-destructive" : ""}
                        />
                        {errors.contact_email && <p className="text-xs text-destructive">{errors.contact_email}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="contact_phone">
                          <Phone className="mr-1 inline h-3.5 w-3.5" />
                          Τηλέφωνο
                        </Label>
                        <Input
                          id="contact_phone"
                          type="tel"
                          value={form.contact_phone}
                          onChange={set("contact_phone")}
                          placeholder="210 1234567"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="rounded-xl border-2 border-primary bg-primary/5 p-5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold">Σύνολο</span>
                    <span className="text-2xl font-extrabold text-primary">€1.499 <span className="text-sm font-normal text-muted-foreground">εφάπαξ</span></span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Μεταφέρεστε σε ασφαλή σελίδα πληρωμής Stripe. Δεκτές κάρτες Visa, Mastercard, American Express.
                  </p>
                  <Button type="submit" disabled={submitting} size="lg" className="mt-4 w-full">
                    {submitting
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ανακατεύθυνση…</>
                      : <>Συνέχεια στην πληρωμή <ArrowRight className="ml-2 h-4 w-4" /></>
                    }
                  </Button>
                </div>
              </form>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Star className="h-4 w-4 text-primary" />
                    Τι περιλαμβάνεται
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {WHAT_YOU_GET.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5 text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong className="text-foreground">Πώς λειτουργεί:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>Συμπληρώνετε τη φόρμα</li>
                    <li>Πληρώνετε με κάρτα μέσω Stripe</li>
                    <li>Η σελίδα σας δημοσιεύεται αμέσως</li>
                    <li>Αποστολή link της σελίδας σας στο email</li>
                  </ol>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-accent bg-accent/5">
                <CardContent className="pt-4 text-xs text-muted-foreground leading-relaxed">
                  Για ερωτήσεις επικοινωνήστε{" "}
                  <Link to="/contact" className="font-medium text-primary hover:underline">εδώ</Link>.
                  Η καταχώριση παραμένει ενεργή έως ότου ζητήσετε αφαίρεσή της.
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default PlacementOrder;
