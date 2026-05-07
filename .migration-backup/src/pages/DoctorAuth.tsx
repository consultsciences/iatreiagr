import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Loader2, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Συμπληρώστε το ονοματεπώνυμο").max(120),
  specialty: z.string().trim().min(2, "Συμπληρώστε ειδικότητα").max(120),
  email: z.string().trim().email("Μη έγκυρο email").max(255),
  password: z.string().min(6, "Τουλάχιστον 6 χαρακτήρες").max(72),
});

const signinSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
});

const DoctorAuthPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signup");
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Είσοδος Ιατρών | iatreia.gr";
  }, []);

  useEffect(() => {
    if (!authLoading && user) navigate("/doctors/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (tab === "signup") {
        const parsed = signupSchema.safeParse({ fullName, specialty, email, password });
        if (!parsed.success) {
          toast({ title: "Σφάλμα", description: parsed.error.issues[0].message, variant: "destructive" });
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/doctors/dashboard`,
            data: { full_name: fullName, role: "doctor" },
          },
        });
        if (error) throw error;

        const userId = data.user?.id;
        if (userId) {
          // Assign doctor role
          const { error: roleErr } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: "doctor" });
          if (roleErr && !roleErr.message.includes("duplicate")) console.warn(roleErr);

          // Create initial doctor profile
          const { error: profErr } = await supabase
            .from("doctor_profiles")
            .insert({
              user_id: userId,
              full_name: fullName,
              specialty,
              email,
              is_published: true,
            });
          if (profErr) console.warn(profErr);
        }

        toast({ title: "Καλωσήρθατε γιατρέ!", description: "Ο λογαριασμός δημιουργήθηκε." });
      } else {
        const parsed = signinSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast({ title: "Σφάλμα", description: parsed.error.issues[0].message, variant: "destructive" });
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Σύνδεση επιτυχής" });
      }
    } catch (err: any) {
      toast({ title: "Σφάλμα", description: err?.message ?? "Κάτι πήγε στραβά", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
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
            <h1 className="text-2xl font-bold">Πύλη Ιατρών</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Δημιουργήστε προφίλ γιατρού, διαχειριστείτε ραντεβού και διεκδικήστε κλινικές.
            </p>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Εγγραφή Ιατρού</TabsTrigger>
              <TabsTrigger value="signin">Σύνδεση</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {tab === "signup" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName">Ονοματεπώνυμο</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={120} placeholder="Δρ. Ιωάννης Παπαδόπουλος" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="specialty">Ειδικότητα</Label>
                      <Input id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} required maxLength={120} placeholder="Καρδιολόγος" />
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} placeholder="doctor@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Κωδικός</Label>
                  <Input id="password" type="password" autoComplete={tab === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={72} placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Παρακαλώ περιμένετε...</>
                  ) : tab === "signup" ? "Δημιουργία λογαριασμού ιατρού" : "Σύνδεση"}
                </Button>
                {tab === "signin" && (
                  <p className="text-center text-xs">
                    <Link to="/forgot-password" className="text-muted-foreground underline hover:text-foreground">
                      Ξεχάσατε τον κωδικό σας;
                    </Link>
                  </p>
                )}
              </form>
            </TabsContent>
          </Tabs>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Είστε ασθενής; <Link to="/auth" className="underline">Σύνδεση ασθενών</Link> · <Link to="/" className="underline">Αρχική</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default DoctorAuthPage;
