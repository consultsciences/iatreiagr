import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Stethoscope } from "lucide-react";
import { useSignIn } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ResetPassword = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = "Νέος κωδικός | iatreia.gr"; }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/");
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ longMessage?: string }>; message?: string };
      setError(e?.errors?.[0]?.longMessage ?? e?.message ?? "Σφάλμα επαναφοράς.");
    } finally {
      setLoading(false);
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
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Νέος κωδικός</CardTitle>
            <CardDescription>Εισάγετε τον κωδικό που λάβατε και ορίστε νέο κωδικό πρόσβασης.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Κωδικός επαλήθευσης</Label>
                <Input
                  id="code"
                  type="text"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Νέος κωδικός πρόσβασης</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading || !isLoaded}>
                {loading ? "Αποθήκευση…" : "Ορισμός νέου κωδικού"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <footer className="py-4 text-center text-xs text-muted-foreground">
        <Link to="/forgot-password" className="underline">Ξαναστείλτε κωδικό</Link>
        {" · "}
        <Link to="/auth" className="underline">Σύνδεση</Link>
      </footer>
    </div>
  );
};

export default ResetPassword;
