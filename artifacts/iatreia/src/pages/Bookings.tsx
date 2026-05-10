import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO, isPast, differenceInHours } from "date-fns";
import { el } from "date-fns/locale";
import {
  Calendar as CalendarIcon, Clock, MapPin, Video, LogOut,
  Loader2, Search as SearchIcon, X, Ban, ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useClerk } from "@clerk/clerk-react";
import type { PatientBooking as Booking } from "@workspace/types";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const buildAppointmentDate = (b: Pick<Booking, "appointment_date" | "appointment_slot">) => {
  const [h, m] = b.appointment_slot.split(":").map(Number);
  const d = parseISO(b.appointment_date);
  d.setHours(h, m, 0, 0);
  return d;
};

const BookingsPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { session } = useClerk();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    document.title = "Τα ραντεβού μου | iatreia.gr";
  }, []);

  useEffect(() => {
    if (!user || !session) { setIsAdmin(false); return; }
    session.getToken().then((token) => {
      fetch(`${BASE}/api/admin/roles/check`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((r) => r.ok ? r.json() : { is_admin: false })
        .then((d) => setIsAdmin(d.is_admin === true))
        .catch(() => setIsAdmin(false));
    });
  }, [user, session]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/bookings", { replace: true });
  }, [user, authLoading, navigate]);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await session?.getToken();
      const res = await fetch(`${BASE}/api/bookings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBookings(data as Booking[]);
    } catch (err: unknown) {
      toast({ title: "Σφάλμα", description: err instanceof Error ? err.message : "Αδυναμία φόρτωσης", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    if (user) loadBookings();
  }, [user, loadBookings]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const token = await session?.getToken();
      const res = await fetch(`${BASE}/api/bookings/${cancelTarget.id}/cancel`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      toast({ title: "Το ραντεβού ακυρώθηκε" });
      setCancelTarget(null);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === cancelTarget.id ? { ...b, status: "cancelled", cancelled_at: new Date().toISOString() } : b,
        ),
      );
    } catch (err: unknown) {
      toast({ title: "Αδυναμία ακύρωσης", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const upcoming = bookings.filter((b) => !isPast(parseISO(`${b.appointment_date}T23:59:59`)));
  const past = bookings.filter((b) => isPast(parseISO(`${b.appointment_date}T23:59:59`)));

  const renderBooking = (b: Booking) => {
    const apptDate = buildAppointmentDate(b);
    const hoursUntil = differenceInHours(apptDate, new Date());
    const isCancelled = b.status === "cancelled";
    const canCancel = !isCancelled && hoursUntil > 24;
    const tooLate = !isCancelled && hoursUntil <= 24 && !isPast(apptDate);

    return (
      <Card key={b.id} className={`p-4 sm:p-5 ${isCancelled ? "opacity-60" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-base font-semibold ${isCancelled ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {b.doctor_name}
              </span>
              {isCancelled && (
                <Badge variant="destructive" className="text-[10px]">
                  <Ban className="mr-1 h-3 w-3" /> Ακυρώθηκε
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{b.doctor_specialty}</div>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {b.visit_type === "in-person" ? (
              <><MapPin className="mr-1 h-3 w-3" /> Στο ιατρείο</>
            ) : (
              <><Video className="mr-1 h-3 w-3" /> Τηλεϊατρική</>
            )}
          </Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarIcon className="h-3.5 w-3.5" />
            {format(apptDate, "EEEE d MMM yyyy", { locale: el })}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> {b.appointment_slot}
          </div>
          <div className="text-muted-foreground">€{b.price}</div>
          <div className="font-mono text-xs text-primary">{b.confirmation_code}</div>
        </div>
        {b.doctor_address && b.visit_type === "in-person" && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{b.doctor_address}</span>
          </div>
        )}
        {canCancel && (
          <div className="mt-3 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setCancelTarget(b)}>
              <X className="mr-1 h-3.5 w-3.5" /> Ακύρωση ραντεβού
            </Button>
          </div>
        )}
        {tooLate && (
          <p className="mt-3 text-right text-xs text-muted-foreground">
            Δεν είναι δυνατή η ακύρωση (λιγότερο από 24 ώρες πριν).
          </p>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo size="lg" />
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
            {isAdmin && (
              <Button asChild variant="ghost" size="sm" className="text-primary">
                <Link to="/admin">
                  <ShieldCheck className="mr-1.5 h-4 w-4" /> Διαχείριση
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Αποσύνδεση
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Τα ραντεβού μου</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Όλες οι κρατήσεις σας σε ένα μέρος. Δωρεάν ακύρωση έως 24 ώρες πριν.
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : bookings.length === 0 ? (
          <Card className="mt-8 p-12 text-center">
            <CalendarIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">Δεν έχετε ακόμη κρατήσεις.</p>
            <Button asChild className="mt-4">
              <Link to="/spaces"><SearchIcon className="mr-1.5 h-4 w-4" /> Αναζήτηση ιατρείου</Link>
            </Button>
          </Card>
        ) : (
          <div className="mt-6 space-y-8">
            {upcoming.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Επερχόμενα ({upcoming.length})
                </h2>
                <div className="space-y-3">{upcoming.map(renderBooking)}</div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Προηγούμενα ({past.length})
                </h2>
                <div className="space-y-3 opacity-75">{past.map(renderBooking)}</div>
              </section>
            )}
          </div>
        )}
      </main>

      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ακύρωση ραντεβού;</AlertDialogTitle>
            <AlertDialogDescription>
              Είστε σίγουρος ότι θέλετε να ακυρώσετε το ραντεβού σας
              {cancelTarget && (
                <> με τον/την <strong className="text-foreground">{cancelTarget.doctor_name}</strong>{" "}
                  στις <strong className="text-foreground">
                    {format(buildAppointmentDate(cancelTarget), "EEEE d MMM, HH:mm", { locale: el })}
                  </strong>;
                </>
              )}
              <br />
              Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Όχι, διατήρησέ το</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleCancel(); }}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Ακύρωση...</> : "Ναι, ακύρωσε"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BookingsPage;
