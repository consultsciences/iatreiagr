import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, LogOut, Stethoscope, UserCog } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useClerk } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import ProfileTab, { type Profile } from "@/components/doctor/ProfileTab";
import AvailabilityTab from "@/components/doctor/AvailabilityTab";
import BookingsTab from "@/components/doctor/BookingsTab";
import ClinicTab from "@/components/doctor/ClinicTab";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const empty: Profile = {
  full_name: "", specialty: "", bio: "", photo_url: "",
  address: "", city: "", phone: "", email: "", clinic_id: "", is_published: true,
};

const DoctorDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { session } = useClerk();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>(empty);
  const [availability, setAvailability] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [newSlot, setNewSlot] = useState({ day_of_week: 1, start_time: "09:00", end_time: "17:00" });
  const [clinicQuery, setClinicQuery] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => { document.title = "Πίνακας Ιατρού | iatreia.gr"; }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate("/doctors/auth", { replace: true });
  }, [user, authLoading, navigate]);

  const getToken = async () => session?.getToken();

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const [profRes, availRes, bksRes, clsRes] = await Promise.all([
          fetch(`${BASE}/api/doctors/me`, { headers }),
          fetch(`${BASE}/api/doctors/me/availability`, { headers }),
          fetch(`${BASE}/api/doctors/me/bookings`, { headers }),
          fetch(`${BASE}/api/doctors/me/claims`, { headers }),
        ]);
        if (profRes.ok) {
          const prof = await profRes.json();
          setProfile({ ...empty, ...prof });
        } else {
          setProfile({ ...empty, email: user.email ?? "" });
        }
        if (availRes.ok) setAvailability(await availRes.json());
        if (bksRes.ok) setBookings(await bksRes.json());
        if (clsRes.ok) setClaims(await clsRes.json());
      } catch (err: any) {
        toast({ title: "Σφάλμα φόρτωσης", description: err?.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/doctors/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      toast({ title: "Αποθηκεύτηκε", description: "Το προφίλ ενημερώθηκε." });
    } catch (err: any) {
      toast({ title: "Σφάλμα", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addSlot = async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/doctors/me/availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newSlot),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAvailability((a) => [...a, data]);
    } catch (err: any) {
      toast({ title: "Σφάλμα", description: err?.message, variant: "destructive" });
    }
  };

  const removeSlot = async (id: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/doctors/me/availability/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      setAvailability((a) => a.filter((s) => s.id !== id));
    } catch (err: any) {
      toast({ title: "Σφάλμα", description: err?.message, variant: "destructive" });
    }
  };

  const claimClinic = async (clinicId: string) => {
    if (!user) return;
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/doctors/me/claims`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ clinic_id: clinicId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setClaims((c) => [...c, data]);
      toast({ title: "Υποβλήθηκε αίτημα", description: "Θα ειδοποιηθείτε όταν εγκριθεί." });
    } catch (err: any) {
      toast({ title: "Σφάλμα", description: err?.message, variant: "destructive" });
    }
  };

  const removeClaim = async (id: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/doctors/me/claims/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      setClaims((c) => c.filter((x) => x.id !== id));
    } catch (err: any) {
      toast({ title: "Σφάλμα", description: err?.message, variant: "destructive" });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-primary">
            <Stethoscope className="h-5 w-5" /> iatreia.gr · Ιατροί
          </Link>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/doctors/auth", { replace: true }); }}>
            <LogOut className="mr-2 h-4 w-4" /> Αποσύνδεση
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Καλωσήρθατε, {profile.full_name || user?.email}</h1>
            <p className="text-sm text-muted-foreground">Διαχειριστείτε το προφίλ, τη διαθεσιμότητα και τα ραντεβού σας.</p>
          </div>
          <Button
            size="lg"
            onClick={() => {
              setActiveTab("profile");
              setTimeout(() => document.getElementById("doctor-profile-card")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
            }}
          >
            <UserCog className="mr-2 h-4 w-4" /> Επεξεργασία δημόσιου προφίλ
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="profile">Προφίλ</TabsTrigger>
            <TabsTrigger value="availability">Διαθεσιμότητα</TabsTrigger>
            <TabsTrigger value="bookings">Ραντεβού</TabsTrigger>
            <TabsTrigger value="clinic">Κλινική</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <ProfileTab profile={profile} setProfile={setProfile} saving={saving} onSave={saveProfile} />
          </TabsContent>
          <TabsContent value="availability" className="mt-4">
            <AvailabilityTab availability={availability} newSlot={newSlot} setNewSlot={setNewSlot} onAdd={addSlot} onRemove={removeSlot} />
          </TabsContent>
          <TabsContent value="bookings" className="mt-4">
            <BookingsTab bookings={bookings} />
          </TabsContent>
          <TabsContent value="clinic" className="mt-4">
            <ClinicTab claims={claims} clinicQuery={clinicQuery} setClinicQuery={setClinicQuery} onClaim={claimClinic} onRemoveClaim={removeClaim} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DoctorDashboard;
