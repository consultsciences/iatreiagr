import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";
import { createListing, CATEGORY_LABEL, type DbListing } from "@/lib/listings";

type Category = DbListing["category"];

const CATEGORIES: Category[] = ["spaces", "equipment", "jobs", "supplies", "services"];

type FormState = {
  category: Category | "";
  title: string;
  description: string;
  city: string;
  region: string;
  price: string;
  price_unit: string;
  price_label: string;
  image_url: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
};

const empty: FormState = {
  category: "",
  title: "",
  description: "",
  city: "",
  region: "",
  price: "",
  price_unit: "",
  price_label: "",
  image_url: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
};

function validate(form: FormState): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!form.category) errs.category = "Επιλέξτε κατηγορία";
  if (!form.title.trim() || form.title.trim().length < 3) errs.title = "Ο τίτλος πρέπει να έχει τουλάχιστον 3 χαρακτήρες";
  if (form.price && isNaN(Number(form.price))) errs.price = "Μη έγκυρη τιμή";
  if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) errs.contact_email = "Μη έγκυρο email";
  return errs;
}

const Post = () => {
  const { user, loading: authLoading } = useAuth();
  const { session } = useClerk();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.title = "Καταχώριση Αγγελίας | iatreia.gr";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/post&tab=signin`, { replace: true });
    }
  }, [user, authLoading, navigate]);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      if (!token) throw new Error("Δεν βρέθηκε session. Παρακαλώ συνδεθείτε ξανά.");

      await createListing(
        {
          category: form.category as Category,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          city: form.city.trim() || undefined,
          region: form.region.trim() || undefined,
          price: form.price.trim() || undefined,
          price_unit: form.price_unit.trim() || undefined,
          price_label: form.price_label.trim() || undefined,
          image_url: form.image_url.trim() || undefined,
          contact_name: form.contact_name.trim() || undefined,
          contact_email: form.contact_email.trim() || undefined,
          contact_phone: form.contact_phone.trim() || undefined,
        },
        token
      );

      setDone(true);
    } catch (err: unknown) {
      toast({
        title: "Σφάλμα υποβολής",
        description: err instanceof Error ? err.message : "Άγνωστο σφάλμα",
        variant: "destructive",
      });
    } finally {
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

      <main className="flex-1 py-10">
        <div className="container mx-auto max-w-2xl px-4">
          {done ? (
            <Card className="text-center">
              <CardContent className="py-14 flex flex-col items-center gap-4">
                <CheckCircle2 className="h-14 w-14 text-primary" />
                <h2 className="text-2xl font-bold">Η αγγελία σας υποβλήθηκε!</h2>
                <p className="text-muted-foreground max-w-sm">
                  Η αγγελία σας βρίσκεται σε αναμονή έγκρισης. Θα δημοσιευθεί μόλις εγκριθεί από την ομάδα μας.
                </p>
                <div className="flex gap-3 mt-2">
                  <Button asChild variant="outline">
                    <Link to="/my-listings">Οι αγγελίες μου</Link>
                  </Button>
                  <Button onClick={() => { setForm(empty); setDone(false); }}>
                    Νέα Αγγελία
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-8">
                <h1 className="text-3xl font-bold">Καταχώριση Αγγελίας</h1>
                <p className="mt-1 text-muted-foreground">
                  Συμπληρώστε τα στοιχεία της αγγελίας σας. Μετά την υποβολή θα ελεγχθεί από την ομάδα μας.
                </p>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Βασικά στοιχεία</CardTitle>
                    <CardDescription>Επιλέξτε κατηγορία και περιγράψτε την αγγελία σας</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="category">Κατηγορία <span className="text-destructive">*</span></Label>
                      <Select
                        value={form.category}
                        onValueChange={(v) => {
                          setForm((f) => ({ ...f, category: v as Category }));
                          setErrors((prev) => { const next = { ...prev }; delete next.category; return next; });
                        }}
                      >
                        <SelectTrigger id="category" className={errors.category ? "border-destructive" : ""}>
                          <SelectValue placeholder="Επιλέξτε κατηγορία…" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="title">Τίτλος <span className="text-destructive">*</span></Label>
                      <Input id="title" value={form.title} onChange={set("title")} placeholder="π.χ. Ιατρείο 40τμ στο κέντρο Αθήνας" className={errors.title ? "border-destructive" : ""} />
                      {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="description">Περιγραφή</Label>
                      <Textarea id="description" value={form.description} onChange={set("description")} placeholder="Αναλυτική περιγραφή…" rows={5} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Τοποθεσία & Τιμή</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="city">Πόλη</Label>
                        <Input id="city" value={form.city} onChange={set("city")} placeholder="π.χ. Αθήνα" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="region">Περιοχή</Label>
                        <Input id="region" value={form.region} onChange={set("region")} placeholder="π.χ. Κολωνάκι" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="price">Τιμή (€)</Label>
                        <Input id="price" type="number" min="0" step="0.01" value={form.price} onChange={set("price")} placeholder="π.χ. 500" className={errors.price ? "border-destructive" : ""} />
                        {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="price_unit">Μονάδα τιμής</Label>
                        <Input id="price_unit" value={form.price_unit} onChange={set("price_unit")} placeholder="π.χ. /μήνα, /ημέρα" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="price_label">Ετικέτα τιμής</Label>
                      <Input id="price_label" value={form.price_label} onChange={set("price_label")} placeholder="π.χ. Από 500€/μήνα" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Εικόνα</CardTitle>
                    <CardDescription>Προαιρετικά, εισάγετε URL φωτογραφίας</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1.5">
                      <Label htmlFor="image_url">URL Εικόνας</Label>
                      <Input id="image_url" value={form.image_url} onChange={set("image_url")} placeholder="https://…" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Στοιχεία Επικοινωνίας</CardTitle>
                    <CardDescription>Αυτά τα στοιχεία θα εμφανίζονται στην αγγελία σας</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact_name">Ονοματεπώνυμο / Επωνυμία</Label>
                      <Input id="contact_name" value={form.contact_name} onChange={set("contact_name")} placeholder="π.χ. Ιωάννης Παπαδόπουλος" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="contact_email">Email</Label>
                        <Input id="contact_email" type="email" value={form.contact_email} onChange={set("contact_email")} placeholder="info@example.gr" className={errors.contact_email ? "border-destructive" : ""} />
                        {errors.contact_email && <p className="text-xs text-destructive">{errors.contact_email}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="contact_phone">Τηλέφωνο</Label>
                        <Input id="contact_phone" type="tel" value={form.contact_phone} onChange={set("contact_phone")} placeholder="210 1234567" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between pt-2">
                  <Button type="button" variant="ghost" asChild>
                    <Link to="/my-listings">Οι αγγελίες μου</Link>
                  </Button>
                  <Button type="submit" disabled={submitting} className="min-w-36">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Υποβολή Αγγελίας"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Post;
