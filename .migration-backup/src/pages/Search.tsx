import { Link } from "react-router-dom";
import { Search as SearchIcon, MapPin, Stethoscope, ChevronLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const SearchPage = () => {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="hidden text-xl font-bold tracking-tight sm:inline">
              iatreia<span className="text-primary">.gr</span>
            </span>
          </Link>
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Ειδικότητα, πάθηση ή όνομα ιατρού" className="pl-9" />
            </div>
            <div className="relative hidden flex-1 md:block">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Πόλη ή περιοχή" className="pl-9" />
            </div>
            <Button className="hidden sm:inline-flex">
              <SearchIcon className="mr-1.5 h-4 w-4" /> Αναζήτηση
            </Button>
            <Button size="icon" className="sm:hidden">
              <SearchIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10">
        <div className="mb-6 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Αρχική</Link> /{" "}
          <span className="text-foreground">Αναζήτηση ιατρών</span>
        </div>

        <Card className="mx-auto max-w-2xl border-dashed p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
            <Stethoscope className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Δεν υπάρχουν ακόμη επαληθευμένοι ιατροί
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
            Ο κατάλογος είναι σε φάση εκκίνησης. Μόλις δημιουργηθούν δημοσιευμένα προφίλ ιατρών,
            θα εμφανίζονται εδώ με πραγματικές αξιολογήσεις και διαθεσιμότητα.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/doctors/auth">
                <UserPlus className="mr-2 h-4 w-4" /> Είσαι ιατρός; Εγγράψου
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/"><ChevronLeft className="mr-1 h-4 w-4" /> Επιστροφή στην αρχική</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SearchPage;
