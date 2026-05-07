import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Stethoscope, Mail } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const schema = z.object({ email: z.string().trim().email("Μη έγκυρο email").max(255) });
export const LAST_EMAIL_KEY = "iatreia:lastAuthEmail";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [prefilled, setPrefilled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => { document.title = "Επαναφορά κωδικού | iatreia.gr"; }, []);

  // Pre-fill from ?email= query param, then fall back to last-used email in localStorage
  useEffect(() => {
    const fromQuery = searchParams.get("email");
    const fromStorage = typeof window !== "undefined" ? window.localStorage.getItem(LAST_EMAIL_KEY) : null;
    const candidate = (fromQuery || fromStorage || "").trim();
    if (candidate && z.string().email().safeParse(candidate).success) {
      setEmail(candidate);
      setPrefilled(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast({ title: "Σφάλμα", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Σφάλμα", description: error.message, variant: "destructive" });
      return;
    }
    setSent(true);
    try { window.localStorage.setItem(LAST_EMAIL_KEY, email.trim()); } catch { /* ignore storage errors */ }
    toast({ title: "Στάλθηκε email", description: "Ελέγξτε τα εισερχόμενά σας." });
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
            <h1 className="text-2xl font-bold">Ξεχάσατε τον κωδικό;</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Συμπληρώστε το email σας και θα σας στείλουμε σύνδεσμο επαναφοράς.
            </p>
          </div>
          {sent ? (
            <div className="space-y-4 text-center">
              <Mail className="mx-auto h-10 w-10 text-primary" />
              <p className="text-sm">Σας στείλαμε ένα email στο <strong>{email}</strong>. Ακολουθήστε τον σύνδεσμο για να ορίσετε νέο κωδικό.</p>
              <Button variant="outline" className="w-full" onClick={() => navigate("/doctors/auth")}>Επιστροφή στη σύνδεση</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setPrefilled(false); }} required maxLength={255} placeholder="doctor@example.com" />
                {prefilled && (
                  <p className="text-xs text-muted-foreground">
                    Συμπληρώθηκε αυτόματα από προηγούμενη χρήση.{" "}
                    <button type="button" className="underline" onClick={() => { setEmail(""); setPrefilled(false); }}>
                      Χρήση άλλου email
                    </button>
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Αποστολή...</> : "Αποστολή συνδέσμου"}
              </Button>
            </form>
          )}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/doctors/auth" className="underline">Επιστροφή στη σύνδεση</Link> · <Link to="/" className="underline">Αρχική</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
