import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, ExternalLink, Clock, CheckCircle2, XCircle } from "lucide-react";
import { fetchMyListings, updateListing, deleteListing, CATEGORY_LABEL, type DbListing, type CreateListingInput } from "@/lib/listings";
import { fetchSubscriptionStatus, type SubscriptionStatus } from "@/lib/subscriptions";
import { PlanStatus } from "@/components/PlanStatus";

type Category = DbListing["category"];
const CATEGORIES: Category[] = ["spaces", "equipment", "jobs", "supplies", "services"];

function statusBadge(status: string) {
  if (status === "published") return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="mr-1 h-3 w-3" />Δημοσιευμένη</Badge>;
  if (status === "pending") return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="mr-1 h-3 w-3" />Σε αναμονή</Badge>;
  if (status === "archived") return <Badge variant="outline" className="text-muted-foreground"><XCircle className="mr-1 h-3 w-3" />Αρχειοθετημένη</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function buildInput(listing: DbListing): CreateListingInput {
  return {
    category: listing.category,
    title: listing.title,
    description: listing.description ?? undefined,
    city: listing.city ?? undefined,
    region: listing.region ?? undefined,
    price: listing.price != null ? String(listing.price) : undefined,
    price_unit: listing.price_unit ?? undefined,
    price_label: listing.price_label ?? undefined,
    image_url: listing.image_url ?? undefined,
    contact_name: listing.contact_name ?? undefined,
    contact_email: listing.contact_email ?? undefined,
    contact_phone: listing.contact_phone ?? undefined,
  };
}

function validate(form: CreateListingInput): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!form.category) errs.category = "Επιλέξτε κατηγορία";
  if (!form.title?.trim() || form.title.trim().length < 3) errs.title = "Ο τίτλος πρέπει να έχει τουλάχιστον 3 χαρακτήρες";
  if (form.price && isNaN(Number(form.price))) errs.price = "Μη έγκυρη τιμή";
  if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) errs.contact_email = "Μη έγκυρο email";
  return errs;
}

const MyListings = () => {
  const { user, loading: authLoading } = useAuth();
  const { session } = useClerk();
  const navigate = useNavigate();
  const [listings, setListings] = useState<DbListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [planStatus, setPlanStatus] = useState<SubscriptionStatus | null>(null);
  const [editTarget, setEditTarget] = useState<DbListing | null>(null);
  const [editForm, setEditForm] = useState<CreateListingInput | null>(null);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Οι αγγελίες μου | iatreia.gr";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/my-listings&tab=signin", { replace: true });
  }, [user, authLoading, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await session?.getToken();
      if (!token) throw new Error("Δεν βρέθηκε session");
      const [rows, status] = await Promise.all([
        fetchMyListings(token),
        fetchSubscriptionStatus(token),
      ]);
      setListings(rows);
      setPlanStatus(status);
    } catch (err: unknown) {
      toast({ title: "Σφάλμα φόρτωσης", description: err instanceof Error ? err.message : "Άγνωστο σφάλμα", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (listing: DbListing) => {
    setEditTarget(listing);
    setEditForm(buildInput(listing));
    setEditErrors({});
  };

  const closeEdit = () => { setEditTarget(null); setEditForm(null); setEditErrors({}); };

  const setF = (field: keyof CreateListingInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditForm((f) => f ? ({ ...f, [field]: e.target.value }) : f);
    setEditErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const handleSave = async () => {
    if (!editTarget || !editForm) return;
    const errs = validate(editForm);
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return; }

    setSaving(true);
    try {
      const token = await session?.getToken();
      if (!token) throw new Error("Δεν βρέθηκε session");
      const updated = await updateListing(editTarget.id, editForm, token);
      setListings((prev) => prev.map((l) => l.id === updated.id ? updated : l));
      toast({ title: "Η αγγελία ενημερώθηκε", description: "Τέθηκε σε αναμονή επανέγκρισης." });
      closeEdit();
    } catch (err: unknown) {
      toast({ title: "Σφάλμα αποθήκευσης", description: err instanceof Error ? err.message : "Άγνωστο σφάλμα", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const token = await session?.getToken();
      if (!token) throw new Error("Δεν βρέθηκε session");
      await deleteListing(id, token);
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Η αγγελία διαγράφηκε" });
    } catch (err: unknown) {
      toast({ title: "Σφάλμα διαγραφής", description: err instanceof Error ? err.message : "Άγνωστο σφάλμα", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 py-10">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Οι αγγελίες μου</h1>
              <p className="mt-1 text-muted-foreground">Διαχειριστείτε τις αγγελίες σας</p>
            </div>
            <Button asChild>
              <Link to="/post"><Plus className="mr-2 h-4 w-4" />Νέα αγγελία</Link>
            </Button>
          </div>

          {planStatus && <PlanStatus status={planStatus} />}

          {listings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
                <p className="text-muted-foreground">Δεν έχετε δημοσιεύσει ακόμα αγγελίες.</p>
                <Button asChild>
                  <Link to="/post"><Plus className="mr-2 h-4 w-4" />Καταχωρίστε την πρώτη σας αγγελία</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <Card key={listing.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{listing.title}</CardTitle>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>{CATEGORY_LABEL[listing.category]}</span>
                          {listing.city && <span>· {listing.city}</span>}
                          {listing.price && <span>· {listing.price}€{listing.price_unit ? ` ${listing.price_unit}` : ""}</span>}
                        </div>
                      </div>
                      <div className="shrink-0">{statusBadge(listing.status)}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      {listing.status === "published" && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/listing/${listing.slug}`} target="_blank">
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />Προβολή
                          </Link>
                        </Button>
                      )}
                      {listing.status !== "published" && (
                        <Button variant="outline" size="sm" onClick={() => openEdit(listing)}>
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />Επεξεργασία
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={deletingId === listing.id}>
                            {deletingId === listing.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
                            Διαγραφή
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Διαγραφή αγγελίας;</AlertDialogTitle>
                            <AlertDialogDescription>
                              Η αγγελία «{listing.title}» θα διαγραφεί μόνιμα. Αυτή η ενέργεια δεν αναιρείται.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Ακύρωση</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(listing.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Διαγραφή
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    {listing.status === "published" && (
                      <p className="mt-2 text-xs text-muted-foreground">Η δημοσιευμένη αγγελία δεν μπορεί να επεξεργαστεί. Επικοινωνήστε μαζί μας για αλλαγές.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />

      <Sheet open={!!editTarget} onOpenChange={(open) => { if (!open) closeEdit(); }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Επεξεργασία αγγελίας</SheetTitle>
          </SheetHeader>

          {editForm && (
            <div className="mt-6 space-y-4 pb-4">
              <div className="space-y-1.5">
                <Label>Κατηγορία <span className="text-destructive">*</span></Label>
                <Select
                  value={editForm.category}
                  onValueChange={(v) => {
                    setEditForm((f) => f ? ({ ...f, category: v as Category }) : f);
                    setEditErrors((prev) => { const next = { ...prev }; delete next.category; return next; });
                  }}
                >
                  <SelectTrigger className={editErrors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Επιλέξτε κατηγορία…" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editErrors.category && <p className="text-xs text-destructive">{editErrors.category}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Τίτλος <span className="text-destructive">*</span></Label>
                <Input value={editForm.title} onChange={setF("title")} className={editErrors.title ? "border-destructive" : ""} />
                {editErrors.title && <p className="text-xs text-destructive">{editErrors.title}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Περιγραφή</Label>
                <Textarea value={editForm.description ?? ""} onChange={setF("description")} rows={4} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Πόλη</Label>
                  <Input value={editForm.city ?? ""} onChange={setF("city")} placeholder="π.χ. Αθήνα" />
                </div>
                <div className="space-y-1.5">
                  <Label>Περιοχή</Label>
                  <Input value={editForm.region ?? ""} onChange={setF("region")} placeholder="π.χ. Κολωνάκι" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Τιμή (€)</Label>
                  <Input type="number" min="0" step="0.01" value={editForm.price ?? ""} onChange={setF("price")} className={editErrors.price ? "border-destructive" : ""} />
                  {editErrors.price && <p className="text-xs text-destructive">{editErrors.price}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Μονάδα τιμής</Label>
                  <Input value={editForm.price_unit ?? ""} onChange={setF("price_unit")} placeholder="/μήνα" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Ετικέτα τιμής</Label>
                <Input value={editForm.price_label ?? ""} onChange={setF("price_label")} placeholder="π.χ. Από 500€/μήνα" />
              </div>

              <div className="space-y-1.5">
                <Label>URL Εικόνας</Label>
                <Input value={editForm.image_url ?? ""} onChange={setF("image_url")} placeholder="https://…" />
              </div>

              <div className="space-y-1.5">
                <Label>Ονοματεπώνυμο / Επωνυμία</Label>
                <Input value={editForm.contact_name ?? ""} onChange={setF("contact_name")} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={editForm.contact_email ?? ""} onChange={setF("contact_email")} className={editErrors.contact_email ? "border-destructive" : ""} />
                  {editErrors.contact_email && <p className="text-xs text-destructive">{editErrors.contact_email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Τηλέφωνο</Label>
                  <Input type="tel" value={editForm.contact_phone ?? ""} onChange={setF("contact_phone")} />
                </div>
              </div>
            </div>
          )}

          <SheetFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={closeEdit} disabled={saving}>Ακύρωση</Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-28">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Αποθήκευση"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MyListings;
