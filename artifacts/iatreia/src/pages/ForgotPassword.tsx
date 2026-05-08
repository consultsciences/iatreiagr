import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const LAST_EMAIL_KEY = "iatreia:lastAuthEmail";

const ForgotPassword = () => {
  const { signIn, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = "Επαναφορά κωδικού | iatreia.gr"; }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    setLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      setSent(true);
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ longMessage?: string }>; message?: string };
      setError(e?.errors?.[0]?.longMessage ?? e?.message ?? "Σφάλμα αποστολής.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Logo size="md" />
        </div>
      </header>
      <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Επαναφορά κωδικού</CardTitle>
            <CardDescription>
              {sent
                ? "Σας στείλαμε κωδικό στο email σας."
                : "Εισάγετε το email σας και θα σας στείλουμε κωδικό επαναφοράς."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>Ελέγξτε τα εισερχόμενά σας και ακολουθήστε τον σύνδεσμο επαναφοράς.</p>
                <Link to="/reset-password" className="block text-primary underline">
                  Έχω τον κωδικό &rarr;
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading || !isLoaded}>
                  {loading ? "Αποστολή…" : "Αποστολή κωδικού"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <footer className="py-4 text-center text-xs text-muted-foreground">
        <Link to="/auth" className="underline">Επιστροφή στη σύνδεση</Link>
        {" · "}
        <Link to="/" className="underline">Αρχική</Link>
      </footer>
    </div>
  );
};

export default ForgotPassword;
