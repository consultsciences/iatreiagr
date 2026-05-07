import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Loader2, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

const credentialsSchema = z.object({
  email: z.string().trim().email("Μη έγκυρο email").max(255),
  password: z.string().min(6, "Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες").max(72),
});

const AuthPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const redirectTo = params.get("redirect") || "/bookings";

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Σύνδεση | iatreia.gr";
  }, []);

  useEffect(() => {
    if (!authLoading && user) navigate(redirectTo, { replace: true });
  }, [user, authLoading, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = credentialsSchema.safeParse({ email, password });
    if (!result.success) {
      toast({ title: "Σφάλμα", description: result.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/bookings` },
        });
        if (error) throw error;
        toast({ title: "Καλωσήρθατε!", description: "Ο λογαριασμός δημιουργήθηκε. Συνδέεστε..." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Σύνδεση επιτυχής" });
      }
    } catch (err: any) {
      toast({
        title: "Σφάλμα",
        description: err?.message ?? "Κάτι πήγε στραβά",
        variant: "destructive",
      });
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
          <h1 className="mb-2 text-2xl font-bold">Καλωσήρθατε</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Συνδεθείτε για να δείτε το ιστορικό των ραντεβού σας.
          </p>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Σύνδεση</TabsTrigger>
              <TabsTrigger value="signup">Εγγραφή</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    maxLength={255}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Κωδικός</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={tab === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    maxLength={72}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Παρακαλώ περιμένετε...</>
                  ) : tab === "signup" ? "Δημιουργία λογαριασμού" : "Σύνδεση"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="underline-offset-2 hover:underline">← Επιστροφή στην αρχική</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
