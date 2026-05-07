import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Stethoscope, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { extractEmailFromRecoveryUrl, extractErrorFromRecoveryUrl } from "@/lib/recoveryEmail";

const schema = z
  .object({
    password: z.string().min(6, "Τουλάχιστον 6 χαρακτήρες").max(72),
    confirm: z.string().min(6).max(72),
  })
  .refine((d) => d.password === d.confirm, { message: "Οι κωδικοί δεν ταιριάζουν", path: ["confirm"] });

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [recoveredEmail, setRecoveredEmail] = useState<string>("");
  const errorAlertRef = useRef<HTMLDivElement | null>(null);

  // Move focus to the alert when an invalid/expired link is detected so
  // screen readers announce the Greek error and keyboard users land on it.
  useEffect(() => {
    if (linkError && errorAlertRef.current) {
      errorAlertRef.current.focus();
    }
  }, [linkError]);

  useEffect(() => { document.title = "Νέος κωδικός | iatreia.gr"; }, []);

  // Detect explicit error in URL hash + try to extract email for prefill
  useEffect(() => {
    const err = extractErrorFromRecoveryUrl(window.location);
    if (err) setLinkError(err);
    const emailParam = extractEmailFromRecoveryUrl(window.location);
    if (emailParam) setRecoveredEmail(emailParam);
  }, []);

  // Wait for Supabase to process the recovery link in the URL hash
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        setLinkError(null);
        if (session?.user?.email) setRecoveredEmail((prev) => prev || session.user!.email!);
      }
    });
    // Fallback: if a session already exists (link processed), allow form
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
        if (data.session.user?.email) setRecoveredEmail((prev) => prev || data.session!.user.email!);
      }
    });
    // If no session arrives within 4s and no explicit error, mark link invalid
    const timer = window.setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) {
          setLinkError((prev) => prev ?? "Ο σύνδεσμος ανάκτησης δεν είναι έγκυρος ή έχει λήξει.");
        }
      });
    }, 4000);
    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      toast({ title: "Σφάλμα", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast({ title: "Σφάλμα", description: error.message, variant: "destructive" });
      return;
    }
    setDone(true);
    toast({ title: "Ο κωδικός ενημερώθηκε" });
    setTimeout(() => navigate("/doctors/dashboard", { replace: true }), 1200);
  };

  const handleRequestNewLink = () => {
    const stored = (typeof window !== "undefined" && window.localStorage.getItem("iatreia:lastAuthEmail")) || "";
    let candidate = (recoveredEmail || stored).trim();
    const isValid = (v: string) => z.string().email().safeParse(v).success;
    if (!isValid(candidate)) {
      const input = window.prompt("Εισάγετε το email σας για να σταλεί νέος σύνδεσμος επαναφοράς:", candidate || "");
      if (input === null) return; // user cancelled
      candidate = input.trim();
      if (!isValid(candidate)) {
        toast({ title: "Μη έγκυρο email", description: "Παρακαλώ εισάγετε ένα έγκυρο email.", variant: "destructive" });
        return;
      }
    }
    navigate(`/forgot-password?email=${encodeURIComponent(candidate)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary">
            <Stethoscope className="h-6 w-6" /> iatreia.gr
          </Link>
        </div>
      </header>
      <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Ορισμός νέου κωδικού</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Εισάγετε τον νέο σας κωδικό πρόσβασης.
            </p>
          </div>
          {done ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
              <p className="text-sm">Ο κωδικός σας ενημερώθηκε. Ανακατεύθυνση...</p>
            </div>
          ) : linkError ? (
            <Alert
              variant="destructive"
              ref={errorAlertRef}
              tabIndex={-1}
              aria-live="assertive"
              aria-atomic="true"
              lang="el"
              data-testid="reset-link-error-alert"
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Μη έγκυρος ή ληγμένος σύνδεσμος</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{linkError}</p>
                <p className="text-sm">
                  Οι σύνδεσμοι ανάκτησης ισχύουν για περιορισμένο χρόνο και μπορούν να χρησιμοποιηθούν μόνο μία φορά.
                  Ζητήστε νέο σύνδεσμο και ανοίξτε τον από το ίδιο πρόγραμμα περιήγησης.
                </p>
                <Button size="sm" variant="outline" onClick={handleRequestNewLink}>
                  Αίτηση νέου συνδέσμου
                </Button>
              </AlertDescription>
            </Alert>
          ) : !ready ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Επαλήθευση συνδέσμου...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Ο σύνδεσμος επαληθεύτηκε</AlertTitle>
                <AlertDescription>
                  Μπορείτε τώρα να ορίσετε έναν νέο κωδικό πρόσβασης για τον λογαριασμό σας.
                </AlertDescription>
              </Alert>
              <div className="space-y-1.5">
                <Label htmlFor="password">Νέος κωδικός</Label>
                <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={72} placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Επιβεβαίωση κωδικού</Label>
                <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} maxLength={72} placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Αποθήκευση...</> : "Αποθήκευση κωδικού"}
              </Button>
            </form>
          )}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/doctors/auth" className="underline">Επιστροφή στη σύνδεση</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
