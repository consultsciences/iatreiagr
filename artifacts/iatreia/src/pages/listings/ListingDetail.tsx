import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { z } from "zod";
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  Loader2,
  Send,
  ShieldCheck,
  Globe,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { fetchListingBySlug, CATEGORY_LABEL, type DbListing } from "@/lib/listings";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const inquirySchema = z.object({
  sender_name: z.string().trim().min(2, "Παρακαλώ συμπληρώστε το ονοματεπώνυμο").max(120),
  sender_email: z.string().trim().email("Μη έγκυρο email").max(255),
  sender_phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Το μήνυμα πρέπει να έχει τουλάχιστον 10 χαρακτήρες").max(5000),
});

const ListingDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [listing, setListing] = useState<DbListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ sender_name: "", sender_email: "", sender_phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const checkoutSuccess = searchParams.get("checkout") === "success";

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchListingBySlug(slug)
      .then(setListing)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (listing) {
      document.title = `${listing.title} — iatreia.gr`;
    }
  }, [listing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    const parsed = inquirySchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const res = await fetch(`${BASE}/api/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listing_id: listing.id,
        sender_name: parsed.data.sender_name,
        sender_email: parsed.data.sender_email,
        sender_phone: parsed.data.sender_phone || null,
        message: parsed.data.message,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      toast({ title: "Σφάλμα", description: "Δεν στάλθηκε το μήνυμα. Δοκιμάστε ξανά.", variant: "destructive" });
      return;
    }
    setSent(true);
    toast({ title: "Στάλθηκε!", description: "Ο καταχωρητής θα επικοινωνήσει σύντομα." });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="mb-3 text-2xl font-bold">Η αγγελία δεν βρέθηκε</h1>
          <p className="mb-6 text-muted-foreground">Πιθανόν να έχει αποσυρθεί ή να μην υπάρχει.</p>
          <Button asChild><Link to="/">Επιστροφή στην αρχική</Link></Button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const isPremium = listing.payment_status === "paid";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {checkoutSuccess && (
        <div className="border-b bg-primary/5 px-4 py-3 text-center text-sm text-primary">
          <CheckCircle2 className="mr-2 inline h-4 w-4" />
          Η πληρωμή ολοκληρώθηκε! Η καταχώρισή σας είναι πλέον ενεργή.
        </div>
      )}

      <section className="border-b py-8" style={{ background: "var(--gradient-soft)" }}>
        <div className="container mx-auto px-4">
          <Link to={`/${listing.category}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> {CATEGORY_LABEL[listing.category]}
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {isPremium && (
              <Badge className="bg-primary text-primary-foreground">Premium Placement</Badge>
            )}
            {listing.badge && <Badge className="bg-accent text-accent-foreground">{listing.badge}</Badge>}
            <Badge variant="secondary">{CATEGORY_LABEL[listing.category]}</Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            {listing.logo_url && (
              <img
                src={listing.logo_url}
                alt={`${listing.title} logo`}
                className="h-14 w-auto rounded-md object-contain"
              />
            )}
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{listing.title}</h1>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {listing.city && (
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {listing.city}{listing.region ? `, ${listing.region}` : ""}</span>
            )}
            {listing.price_label && (
              <span className="text-lg font-bold text-primary">{listing.price_label}</span>
            )}
            {listing.website_url && (
              <a
                href={listing.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                <Globe className="h-4 w-4" /> Website
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[1fr_380px]">
          <div>
            {listing.image_url && (
              <div className="mb-6 overflow-hidden rounded-xl border bg-muted">
                <img src={listing.image_url} alt={listing.title} className="aspect-[16/10] w-full object-cover" />
              </div>
            )}

            {listing.description && (
              <Card className="mb-6 p-6">
                <h2 className="mb-3 text-xl font-bold">Περιγραφή</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                  {listing.description}
                </p>
              </Card>
            )}

            {listing.proposal && (
              <Card className="mb-6 border-l-4 border-l-primary p-6">
                <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
                  <FileText className="h-5 w-5 text-primary" />
                  Πρόταση Συνεργασίας
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                  {listing.proposal}
                </p>
              </Card>
            )}

            {!listing.description && !listing.proposal && (
              <Card className="mb-6 p-6">
                <h2 className="mb-3 text-xl font-bold">Περιγραφή</h2>
                <p className="text-sm text-muted-foreground">
                  Δεν υπάρχει αναλυτική περιγραφή. Επικοινωνήστε με τον καταχωρητή για περισσότερες πληροφορίες.
                </p>
              </Card>
            )}

            {listing.meta && (
              <Card className="mb-6 p-6">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Χαρακτηριστικά</h3>
                <p className="text-sm text-foreground/90">{listing.meta}</p>
              </Card>
            )}

            <Card className="border-l-4 border-l-accent bg-accent/5 p-5 text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Σημείωση: </strong>
              Το iatreia.gr φιλοξενεί αγγελίες τρίτων και δεν διεκπεραιώνει συναλλαγές, πληρωμές ή συμβάσεις. Επιβεβαιώστε όλα τα στοιχεία απευθείας με τον καταχωρητή.
            </Card>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-6">
              <h2 className="mb-1 text-lg font-bold">Επικοινωνία με τον καταχωρητή</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-primary" />
                Τα στοιχεία σας παραμένουν ιδιωτικά
              </p>

              {sent ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
                  <div className="mb-1 font-semibold text-primary">Το μήνυμά σας στάλθηκε</div>
                  <p className="text-muted-foreground">Ο καταχωρητής θα επικοινωνήσει μαζί σας στο email που δηλώσατε.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <Label htmlFor="name">Ονοματεπώνυμο *</Label>
                    <Input id="name" value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })} maxLength={120} />
                    {errors.sender_name && <p className="mt-1 text-xs text-destructive">{errors.sender_name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={form.sender_email} onChange={(e) => setForm({ ...form, sender_email: e.target.value })} maxLength={255} />
                    {errors.sender_email && <p className="mt-1 text-xs text-destructive">{errors.sender_email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Τηλέφωνο</Label>
                    <Input id="phone" type="tel" value={form.sender_phone} onChange={(e) => setForm({ ...form, sender_phone: e.target.value })} maxLength={40} />
                  </div>
                  <div>
                    <Label htmlFor="msg">Μήνυμα *</Label>
                    <Textarea id="msg" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={5000} placeholder="Γεια σας, ενδιαφέρομαι για την αγγελία..." />
                    {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Αποστολή ερώτησης
                  </Button>
                </form>
              )}

              {(listing.contact_email || listing.contact_phone) && (
                <div className="mt-5 border-t pt-4 text-xs">
                  <p className="mb-2 font-semibold uppercase tracking-wide text-muted-foreground">Άμεση επικοινωνία</p>
                  {listing.contact_email && (
                    <div className="flex items-center gap-2 text-foreground/90">
                      <Mail className="h-3.5 w-3.5" />
                      <a href={`mailto:${listing.contact_email}`} className="hover:underline">{listing.contact_email}</a>
                    </div>
                  )}
                  {listing.contact_phone && (
                    <div className="mt-1 flex items-center gap-2 text-foreground/90">
                      <Phone className="h-3.5 w-3.5" />
                      <a href={`tel:${listing.contact_phone}`} className="hover:underline">{listing.contact_phone}</a>
                    </div>
                  )}
                  {listing.website_url && (
                    <div className="mt-1 flex items-center gap-2 text-foreground/90">
                      <Globe className="h-3.5 w-3.5" />
                      <a href={listing.website_url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{listing.website_url.replace(/^https?:\/\//, "")}</a>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {isPremium && (
              <Card className="mt-4 border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-medium text-primary">
                  ✓ Premium Placement — επαληθευμένη καταχώριση
                </p>
              </Card>
            )}
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default ListingDetail;
