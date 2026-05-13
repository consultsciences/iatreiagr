import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import {
  Stethoscope,
  ArrowLeft,
  Search,
  Sparkles,
  Star,
  ShieldCheck,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClerk } from "@clerk/clerk-react";
import { toast } from "@/hooks/use-toast";
import { privateClinics } from "@/data/privateClinics";
import {
  getClinicPremium,
  getClinicTier,
  hasOverride,
  resetClinicPremium,
  setClinicPremium,
  subscribeClinicPremium,
  type ClinicTier,
} from "@/data/clinicPremium";

const TIER_META: Record<
  Exclude<ClinicTier, "free">,
  { label: string; icon: typeof Sparkles; color: string }
> = {
  premium: { label: "Premium", icon: Sparkles, color: "text-amber-600" },
  featured: { label: "Featured", icon: Star, color: "text-primary" },
  verified: { label: "Verified", icon: ShieldCheck, color: "text-emerald-600" },
};

// Subscribe to override changes so the list re-renders after save/reset.
function usePremiumVersion() {
  return useSyncExternalStore(
    (cb) => subscribeClinicPremium(cb),
    () => Math.random(),
    () => 0,
  );
}

const ClinicsAdmin = () => {
  usePremiumVersion();
  const { session } = useClerk();
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [tier, setTier] = useState<ClinicTier>("free");
  const [tagline, setTagline] = useState("");
  const [badgeHidden, setBadgeHidden] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = !term
      ? privateClinics
      : privateClinics.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            c.address.toLowerCase().includes(term),
        );
    return list.slice(0, 50);
  }, [q]);

  const selected = useMemo(
    () => privateClinics.find((c) => c.id === selectedId) ?? null,
    [selectedId],
  );

  // Load values when selection changes.
  useEffect(() => {
    if (!selected) return;
    const info = getClinicPremium(selected.id);
    setTier(getClinicTier(selected.id));
    setTagline(info?.tagline ?? "");
    setBadgeHidden(info?.badgeHidden ?? false);
  }, [selected]);

  const handleSave = async () => {
    if (!selected) return;
    const token = (await session?.getToken()) ?? "";
    if (tier === "free") {
      await setClinicPremium(selected.id, null, token);
    } else {
      await setClinicPremium(selected.id, {
        tier,
        tagline: tagline.trim() || undefined,
        badgeHidden: badgeHidden || undefined,
      }, token);
    }
    toast({
      title: "Αποθηκεύτηκε",
      description: `${selected.name.slice(0, 60)} → ${tier}`,
    });
  };

  const handleReset = async () => {
    if (!selected) return;
    const token = (await session?.getToken()) ?? "";
    await resetClinicPremium(selected.id, token);
    setTier(getClinicTier(selected.id));
    const info = getClinicPremium(selected.id);
    setTagline(info?.tagline ?? "");
    setBadgeHidden(info?.badgeHidden ?? false);
    toast({ title: "Επαναφορά στις προεπιλογές" });
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
          <Link
            to="/clinics"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Κατάλογος κλινικών
          </Link>
        </div>
      </header>

      <section className="border-b bg-muted/40 py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Διαχείριση Premium συνδρομών
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Ενεργοποίησε Premium / Featured / Verified, διαχειρίσου το tagline
            και την προβολή του badge ανά κλινική. Οι ρυθμίσεις αποθηκεύονται
            τοπικά στον browser και επηρεάζουν την κατάταξη στο{" "}
            <Link to="/clinics" className="text-primary hover:underline">
              /clinics
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto grid gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          {/* List */}
          <div>
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Αναζήτηση κλινικής…"
                className="pl-9"
              />
            </div>
            <div className="space-y-2">
              {filtered.map((c) => {
                const t = getClinicTier(c.id);
                const info = getClinicPremium(c.id);
                const meta = t !== "free" ? TIER_META[t] : null;
                const Icon = meta?.icon;
                const overridden = hasOverride(c.id);
                const isActive = selectedId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {c.name}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {c.address || c.regionalUnit}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {meta && Icon && (
                          <Badge
                            variant="outline"
                            className={`gap-1 ${meta.color}`}
                          >
                            <Icon className="h-3 w-3" />
                            {meta.label}
                          </Badge>
                        )}
                        {info?.badgeHidden && (
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        {overridden && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                  Καμία κλινική δεν ταιριάζει.
                </div>
              )}
            </div>
            {q.trim() === "" && (
              <p className="mt-3 text-xs text-muted-foreground">
                Εμφανίζονται οι πρώτες 50. Χρησιμοποίησε την αναζήτηση για να
                βρεις συγκεκριμένη κλινική.
              </p>
            )}
          </div>

          {/* Editor */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Card className="p-5">
              <h2 className="text-base font-semibold">Ρυθμίσεις συνδρομής</h2>
              {!selected ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Επίλεξε μια κλινική από τη λίστα για να επεξεργαστείς τις
                  ρυθμίσεις της.
                </p>
              ) : (
                <div className="mt-4 space-y-5">
                  <div>
                    <div className="text-sm font-medium leading-snug">
                      {selected.name}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      ID #{selected.id} · {selected.region}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tier">Επίπεδο</Label>
                    <Select
                      value={tier}
                      onValueChange={(v) => setTier(v as ClinicTier)}
                    >
                      <SelectTrigger id="tier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="premium">
                          ✨ Premium (κορυφή)
                        </SelectItem>
                        <SelectItem value="featured">
                          ⭐ Featured (προτεινόμενο)
                        </SelectItem>
                        <SelectItem value="verified">
                          🛡️ Verified (επαληθευμένο)
                        </SelectItem>
                        <SelectItem value="free">
                          Free (καμία προβολή)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="π.χ. JCI Certified · Διεθνείς ασθενείς"
                      maxLength={80}
                      disabled={tier === "free"}
                    />
                    <p className="text-xs text-muted-foreground">
                      Σύντομο μήνυμα marketing που εμφανίζεται στην κάρτα.
                    </p>
                  </div>

                  <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="badge-visible"
                        className="flex items-center gap-1.5"
                      >
                        {badgeHidden ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        Προβολή badge
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Όταν είναι ανενεργό, η κάρτα δεν δείχνει badge — η
                        κατάταξη όμως διατηρείται.
                      </p>
                    </div>
                    <Switch
                      id="badge-visible"
                      checked={!badgeHidden}
                      onCheckedChange={(v) => setBadgeHidden(!v)}
                      disabled={tier === "free"}
                    />
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button onClick={handleSave} className="gap-2">
                      <Save className="h-4 w-4" /> Αποθήκευση
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="gap-2"
                      disabled={!hasOverride(selected.id)}
                    >
                      <RotateCcw className="h-4 w-4" /> Επαναφορά
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Σημείωση: οι αλλαγές αποθηκεύονται τοπικά στον browser. Για
                    συγχρονισμό μεταξύ συσκευών χρειάζεται σύνδεση με το
                    backend.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ClinicsAdmin;
