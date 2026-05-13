import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SignIn, SignUp, useUser } from "@clerk/clerk-react";
import { Logo } from "@/components/Logo";

const AuthPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { isSignedIn, isLoaded } = useUser();
  const redirectTo = params.get("redirect") || "/my-listings";
  const tab = params.get("tab") === "signup" ? "signup" : "signin";

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showError, setShowError] = useState(false);

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
          <Logo size="lg" />
        </div>
      </header>
      <main className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12 gap-4">

        {/* Terms acceptance checkbox */}
        <div className="w-full max-w-md rounded-xl border bg-background/80 px-5 py-4 shadow-sm">
          <label className="flex items-start gap-3 cursor-pointer select-none group">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  if (e.target.checked) setShowError(false);
                }}
                className="peer sr-only"
                id="terms-checkbox"
              />
              <div
                className={[
                  "h-4 w-4 rounded border-2 transition-colors",
                  termsAccepted
                    ? "border-primary bg-primary"
                    : showError
                    ? "border-destructive bg-destructive/10"
                    : "border-input bg-background group-hover:border-primary/60",
                ].join(" ")}
              >
                {termsAccepted && (
                  <svg
                    className="h-3 w-3 text-primary-foreground"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs leading-relaxed text-muted-foreground">
              Έχω διαβάσει και αποδέχομαι τους{" "}
              <Link
                to="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-2 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Όρους Χρήσης
              </Link>
              {" "}και την{" "}
              <Link
                to="/listings-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-2 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Πολιτική Αγγελιών
              </Link>{" "}
              του iatreia.gr.
            </span>
          </label>
          {showError && (
            <p className="mt-2 text-xs text-destructive pl-7">
              Παρακαλώ αποδεχτείτε τους Όρους Χρήσης και την Πολιτική Αγγελιών για να συνεχίσετε.
            </p>
          )}
        </div>

        {/* Clerk auth component — blurred/disabled until terms are accepted */}
        <div className="relative w-full flex justify-center">
          {!termsAccepted && (
            <button
              type="button"
              aria-label="Αποδεχτείτε τους όρους για να συνεχίσετε"
              onClick={() => setShowError(true)}
              className="absolute inset-0 z-10 rounded-xl cursor-pointer"
            />
          )}
          <div
            className={[
              "transition-all duration-200",
              termsAccepted ? "opacity-100 pointer-events-auto" : "opacity-40 pointer-events-none blur-[1px]",
            ].join(" ")}
          >
            {tab === "signup" ? (
              <SignUp
                routing="path"
                path={`${basePath}/auth`}
                fallbackRedirectUrl={`${basePath}${redirectTo}`}
              />
            ) : (
              <SignIn
                routing="path"
                path={`${basePath}/auth`}
                fallbackRedirectUrl={`${basePath}${redirectTo}`}
              />
            )}
          </div>
        </div>
      </main>
      <footer className="py-4 text-center text-xs text-muted-foreground">
        <Link to="/" className="underline-offset-2 hover:underline">← Επιστροφή στην αρχική</Link>
      </footer>
    </div>
  );
};

export default AuthPage;
