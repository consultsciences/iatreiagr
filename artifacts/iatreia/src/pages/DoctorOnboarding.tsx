import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, IdCard, Loader2,
  Sparkles, Stethoscope, UserPlus, Crown, Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useClerk } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type Tier = "free" | "premium" | "pro";

const STEPS = [
  { id: "account", label: "Λογαριασμός", icon: UserPlus },
  { id: "identity", label: "Ταυτοποίηση", icon: IdCard },
  { id: "profile", label: "Προφίλ", icon: Stethoscope },
  { id: "plan", label: "Πλάνο", icon: Sparkles },
  { id: "done", label: "Ολοκλήρωση", icon: CheckCircle2 },
] as const;

const identitySchema = z.object({
  registrationNumber: z.string().trim().min(3, "Αριθμός μητρώου ΠΙΣ").max(40),
  specialty: z.string().trim().min(2, "Συμπληρώστε ειδικότητα").max(120),
  phone: z.string().trim().min(8, "Έγκυρο τηλέφωνο").max(30),
});

const profileSchema = z.object({
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(4).max(200),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
  photoUrl: z.string().trim().url("Μη έγκυρο URL").max(500).optional().or(z.literal("")),
});

const PLANS: {
  id: Tier;
  name: string;
  price: string;
  cadence: string;
  highlight?: boolean;
  icon: typeof Crown;
  features: string[];
}[] = [
  {
    id: "free",
    name: "Δωρεάν",
    price: "€0",
    cadence: "για πάντα",
    icon: Stethoscope,
    features: [
      "Δημόσιο προφίλ ιατρού",
      "Online ραντεβού",
      "Βασική εμφάνιση στην αναζήτηση",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "€29",
    cadence: "/ μήνα",
    highlight: true,
    icon: Crown,
    features: [
      "Όλα του Δωρεάν",
      "Προτεραιότητα στην αναζήτηση",
      "Σήμα Premium στο προφίλ",
      "Στατιστικά επισκεψιμότητας",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "€79",
    cadence: "/ μήνα",
    icon: Zap,
    features: [
      "Όλα του Premium",
      "Προβολή στην αρχική σελίδα",
      "Προηγμένα analytics",
      "Υποστήριξη κατά προτεραιότητα",
    ],
  },
];

const DoctorOnboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { session, openSignUp } = useClerk();
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [registrationNumber, setRegistrationNumber] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [tier, setTier] = useState<Tier>("premium");

  useEffect(() => {
    document.title = "Onboarding Ιατρών | iatreia.gr";
  }, []);

  useEffect(() => {
    if (!authLoading && user && stepIdx === 0) {
      setStepIdx(1);
    }
  }, [authLoading, user]);

  const progress = useMemo(() => ((stepIdx + 1) / STEPS.length) * 100, [stepIdx]);

  const handleAccount = () => {
    openSignUp({
      afterSignUpUrl: `${BASE}/doctors/onboarding`,
    });
  };

  const handleIdentity = () => {
    const parsed = identitySchema.safeParse({ registrationNumber, specialty, phone });
    if (!parsed.success) {
      toast({ title: "Σφάλμα", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setStepIdx(2);
  };

  const handleProfile = () => {
    const parsed = profileSchema.safeParse({ city, address, bio, photoUrl });
    if (!parsed.success) {
      toast({ title: "Σφάλμα", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setStepIdx(3);
  };

  const handlePlan = async () => {
    if (!user) {
      toast({ title: "Σφάλμα", description: "Δεν βρέθηκε ενεργή σύνοδος.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const token = await session?.getToken();
      const bioWithReg = [bio?.trim(), `Αρ. Μητρώου ΠΙΣ: ${registrationNumber}`]
        .filter(Boolean)
        .join("\n\n");
      const res = await fetch(`${BASE}/api/doctors/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          full_name: user.email,
          email: user.email,
          specialty,
          phone,
          city,
          address,
          bio: bioWithReg,
          photo_url: photoUrl || null,
          subscription_tier: tier,
          onboarding_completed_at: new Date().toISOString(),
          is_published: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      toast({ title: "Επιτυχία", description: "Το προφίλ σας δημιουργήθηκε." });
      setStepIdx(4);
    } catch (err: any) {
      toast({ title: "Σφάλμα", description: err?.message ?? "Κάτι πήγε στραβά", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => setStepIdx((i) => Math.max(0, i - 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary">
            <Stethoscope className="h-6 w-6" /> iatreia.gr
          </Link>
          <Link to="/doctors/auth" className="text-sm text-muted-foreground underline">
            Έχω ήδη λογαριασμό
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Διεκδικήστε το προφίλ σας</h1>
          <p className="mt-2 text-muted-foreground">
            Ολοκληρώστε τα 5 βήματα για να εμφανιστείτε στο iatreia.gr και να αρχίσετε να δέχεστε ραντεβού.
          </p>
        </div>

        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <ol className="mt-4 grid grid-cols-5 gap-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === stepIdx;
              const done = i < stepIdx;
              return (
                <li key={s.id} className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-medium",
                      done && "border-primary bg-primary text-primary-foreground",
                      active && "border-primary text-primary",
                      !active && !done && "border-muted bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={cn("mt-1 text-[11px] sm:text-xs", active ? "font-medium" : "text-muted-foreground")}>
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {stepIdx === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Δημιουργία λογαριασμού</CardTitle>
              <CardDescription>Δημιουργήστε λογαριασμό ιατρού για να συνεχίσετε.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-6">
              <p className="text-center text-sm text-muted-foreground max-w-sm">
                Θα ανακατευθυνθείτε στη φόρμα εγγραφής. Επιστρέψτε σε αυτήν τη σελίδα μόλις ολοκληρώσετε.
              </p>
              <Button size="lg" onClick={handleAccount}>
                <UserPlus className="mr-2 h-4 w-4" /> Εγγραφή ιατρού
              </Button>
              <p className="text-xs text-muted-foreground">
                Έχετε ήδη λογαριασμό;{" "}
                <Link to="/doctors/auth" className="underline">Συνδεθείτε εδώ</Link>
              </p>
            </CardContent>
          </Card>
        )}

        {stepIdx === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Ταυτοποίηση</CardTitle>
              <CardDescription>
                Επιβεβαιώνουμε ότι είστε εγγεγραμμένος ιατρός. Τα στοιχεία θα ελεγχθούν από την ομάδα μας.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reg">Αριθμός Μητρώου ΠΙΣ</Label>
                <Input id="reg" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} placeholder="π.χ. 12345" maxLength={40} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="spec">Ειδικότητα</Label>
                <Input id="spec" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Καρδιολόγος" maxLength={120} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Τηλέφωνο επικοινωνίας</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="2101234567" maxLength={30} />
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={goBack} disabled={!!user}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Πίσω
                </Button>
                <Button onClick={handleIdentity}>
                  Συνέχεια <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {stepIdx === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Δημόσιο προφίλ</CardTitle>
              <CardDescription>Πληροφορίες που βλέπουν οι ασθενείς.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="city">Πόλη</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Αθήνα" maxLength={80} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="addr">Διεύθυνση ιατρείου</Label>
                  <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Λεωφ. Κηφισίας 12" maxLength={200} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="photo">URL Φωτογραφίας (προαιρετικό)</Label>
                <Input id="photo" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" maxLength={500} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bio">Σύντομο βιογραφικό (προαιρετικό)</Label>
                <Textarea id="bio" rows={5} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} placeholder="Σπουδές, εμπειρία, εξειδικεύσεις…" />
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Πίσω
                </Button>
                <Button onClick={handleProfile}>
                  Συνέχεια <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {stepIdx === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Επιλέξτε πλάνο</CardTitle>
              <CardDescription>
                Ξεκινήστε δωρεάν ή αναβαθμίστε για περισσότερη προβολή. Οι πληρωμές θα ενεργοποιηθούν σύντομα.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {PLANS.map((p) => {
                  const Icon = p.icon;
                  const selected = tier === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTier(p.id)}
                      className={cn(
                        "relative flex flex-col rounded-lg border bg-card p-4 text-left transition-all",
                        selected ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/50",
                      )}
                    >
                      {p.highlight && (
                        <Badge className="absolute -top-2 right-3">Προτεινόμενο</Badge>
                      )}
                      <div className="mb-2 flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{p.name}</span>
                      </div>
                      <div className="mb-3">
                        <span className="text-2xl font-bold">{p.price}</span>{" "}
                        <span className="text-xs text-muted-foreground">{p.cadence}</span>
                      </div>
                      <ul className="space-y-1.5 text-sm">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Πίσω
                </Button>
                <Button onClick={handlePlan} disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Ολοκλήρωση εγγραφής <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {stepIdx === 4 && (
          <Card>
            <CardHeader>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-center">Είστε έτοιμοι!</CardTitle>
              <CardDescription className="text-center">
                Το προφίλ σας δημιουργήθηκε. Επιλεγμένο πλάνο:{" "}
                <strong className="text-foreground">{PLANS.find((p) => p.id === tier)?.name}</strong>.
                {tier !== "free" && " Θα σας ειδοποιήσουμε μόλις ενεργοποιηθούν οι πληρωμές."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => navigate("/doctors/dashboard")}>
                Μετάβαση στον πίνακα ελέγχου
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Επιστροφή στην αρχική
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default DoctorOnboarding;
