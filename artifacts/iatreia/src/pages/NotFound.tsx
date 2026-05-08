import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "Σελίδα δεν βρέθηκε | iatreia.gr";
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center py-24">
        <div className="container mx-auto max-w-md px-4 text-center">
          <div className="mb-6 text-8xl font-bold text-primary/20">404</div>
          <h1 className="mb-3 text-2xl font-bold">Η σελίδα δεν βρέθηκε</h1>
          <p className="mb-8 text-muted-foreground">
            Η σελίδα που ζητήσατε δεν υπάρχει ή έχει μετακινηθεί. Ελέγξτε τον σύνδεσμο ή επιστρέψτε στην αρχική.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link to="/"><Home className="mr-2 h-4 w-4" />Αρχική σελίδα</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/search"><Search className="mr-2 h-4 w-4" />Αναζήτηση αγγελιών</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default NotFound;
