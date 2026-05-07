import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Stethoscope, ChevronLeft, UserPlus, Search as SearchIcon, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface DoctorProfile {
  id: string;
  user_id: string;
  full_name: string;
  specialty?: string | null;
  city?: string | null;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
  subscription_tier?: string | null;
  is_published?: boolean;
}

const DoctorProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) { setNotFound(true); setLoading(false); return; }
    fetch(`${BASE}/api/doctors/${userId}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (!r.ok) throw new Error("Server error");
        return r.json();
      })
      .then((data) => { if (data) setProfile(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="min-h-screen bg-muted/30">
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
        {loading ? (
          <Card className="mx-auto max-w-2xl p-10 text-center">
            <p className="text-muted-foreground">Φόρτωση προφίλ…</p>
          </Card>
        ) : notFound || !profile ? (
          <Card className="mx-auto max-w-2xl border-dashed p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
              <Stethoscope className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Το προφίλ δεν είναι διαθέσιμο
            </h1>
            <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
              Δεν υπάρχει δημοσιευμένο προφίλ ιατρού για αυτή τη διεύθυνση.
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
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
                    {profile.specialty && (
                      <Badge variant="secondary" className="mt-1">{profile.specialty}</Badge>
                    )}
                  </div>
                  {profile.subscription_tier && profile.subscription_tier !== "free" && (
                    <Badge className="shrink-0">Premium</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {profile.city && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{profile.city}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <a href={`tel:${profile.phone}`} className="hover:text-primary">{profile.phone}</a>
                  </div>
                )}
                {profile.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <a href={`mailto:${profile.email}`} className="hover:text-primary">{profile.email}</a>
                  </div>
                )}
                {profile.bio && (
                  <p className="pt-2 text-foreground">{profile.bio}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" /> Ραντεβού
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to={`/bookings?doctor=${userId}`}>Κλείστε ραντεβού</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorProfile;
