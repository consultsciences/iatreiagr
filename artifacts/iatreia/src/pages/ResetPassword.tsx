import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Stethoscope } from "lucide-react";
import { SignIn } from "@clerk/clerk-react";

const ResetPassword = () => {
  const navigate = useNavigate();

  useEffect(() => { document.title = "Νέος κωδικός | iatreia.gr"; }, []);

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
        <SignIn
          routing="hash"
          afterSignInUrl={`${basePath}/doctors/dashboard`}
        />
      </main>
      <footer className="py-4 text-center text-xs text-muted-foreground">
        <Link to="/doctors/auth" className="underline">Επιστροφή στη σύνδεση</Link>
      </footer>
    </div>
  );
};

export default ResetPassword;
