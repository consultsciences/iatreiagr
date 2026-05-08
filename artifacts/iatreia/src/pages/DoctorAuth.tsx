import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SignIn, useUser } from "@clerk/clerk-react";
import { Logo } from "@/components/Logo";

const DoctorAuthPage = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    document.title = "Είσοδος Ιατρών | iatreia.gr";
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) navigate("/doctors/dashboard", { replace: true });
  }, [isSignedIn, isLoaded, navigate]);

  const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Logo size="md" />
        </div>
      </header>
      <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">Πύλη Ιατρών</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Συνδεθείτε ή δημιουργήστε λογαριασμό ιατρού.
            </p>
          </div>
          <SignIn
            routing="path"
            path={`${basePath}/doctors/auth`}
            afterSignInUrl={`${basePath}/doctors/dashboard`}
            afterSignUpUrl={`${basePath}/doctors/dashboard`}
          />
        </div>
      </main>
      <footer className="py-4 text-center text-xs text-muted-foreground">
        Είστε ασθενής;{" "}
        <Link to="/auth" className="underline">Σύνδεση ασθενών</Link>
        {" · "}
        <Link to="/" className="underline">Αρχική</Link>
      </footer>
    </div>
  );
};

export default DoctorAuthPage;
