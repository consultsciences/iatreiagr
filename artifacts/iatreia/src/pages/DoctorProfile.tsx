import { Link, useParams } from "react-router-dom";
import { Stethoscope, ChevronLeft, UserPlus, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const DoctorProfile = () => {
  useParams();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              iatreia<span className="text-primary">.gr</span>
            </span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/search">
              <ChevronLeft className="mr-1 h-4 w-4" /> Πίσω στην αναζήτηση
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10">
        <Card className="mx-auto max-w-2xl border-dashed p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
            <Stethoscope className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Το προφίλ δεν είναι διαθέσιμο
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
            Δεν υπάρχει δημοσιευμένο προφίλ ιατρού για αυτή τη διεύθυνση. Ο κατάλογος ιατρών είναι
            σε φάση εκκίνησης — τα πρώτα επαληθευμένα προφίλ θα εμφανιστούν σύντομα.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/search">
                <SearchIcon className="mr-2 h-4 w-4" /> Αναζήτηση ιατρών
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/doctors/auth">
                <UserPlus className="mr-2 h-4 w-4" /> Είσαι ιατρός; Εγγράψου
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DoctorProfile;
