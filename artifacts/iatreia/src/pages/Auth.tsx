import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Stethoscope } from "lucide-react";
import { SignIn, SignUp, useUser } from "@clerk/clerk-react";

const AuthPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { isSignedIn, isLoaded } = useUser();
  const redirectTo = params.get("redirect") || "/bookings";
  const tab = params.get("tab") === "signup" ? "signup" : "signin";

  useEffect(() => {
    document.title = "Σύνδεση | iatreia.gr";
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) navigate(redirectTo, { replace: true });
  }, [isSignedIn, isLoaded, navigate, redirectTo]);

  const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

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
        {tab === "signup" ? (
          <SignUp
            routing="hash"
            afterSignUpUrl={`${basePath}${redirectTo}`}
          />
        ) : (
          <SignIn
            routing="hash"
            afterSignInUrl={`${basePath}${redirectTo}`}
          />
        )}
      </main>
      <footer className="py-4 text-center text-xs text-muted-foreground">
        <Link to="/" className="underline-offset-2 hover:underline">← Επιστροφή στην αρχική</Link>
      </footer>
    </div>
  );
};

export default AuthPage;
