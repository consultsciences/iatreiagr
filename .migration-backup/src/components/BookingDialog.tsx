import { useEffect, useState } from "react";
import { z } from "zod";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Link } from "react-router-dom";
import { CheckCircle2, Calendar as CalendarIcon, Clock, MapPin, Video, User, Mail, Phone, FileText, Loader2, CalendarPlus, Download, ListOrdered } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const patientSchema = z.object({
  name: z.string().trim().min(2, "Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες").max(100),
  email: z.string().trim().email("Μη έγκυρο email").max(255),
  phone: z.string().trim().min(8, "Μη έγκυρος αριθμός τηλεφώνου").max(20),
  reason: z.string().trim().max(500).optional(),
});

type Errors = Partial<Record<keyof z.infer<typeof patientSchema>, string>>;

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  date: Date;
  slot: string;
  type: "in-person" | "telehealth";
  price: number;
  address?: string;
}

const generateCode = () => `IAT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const BookingDialog = ({
  open, onOpenChange, doctorId, doctorName, doctorSpecialty, date, slot, type, price, address,
}: BookingDialogProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<"details" | "submitting" | "success">("details");
  const [form, setForm] = useState({ name: "", email: "", phone: "", reason: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [confirmationCode, setConfirmationCode] = useState(generateCode);

  useEffect(() => {
    if (open && user?.email && !form.email) {
      setForm((f) => ({ ...f, email: user.email! }));
    }
  }, [open, user, form.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = patientSchema.safeParse(form);
    if (!result.success) {
      const errs: Errors = {};
      result.error.issues.forEach((i) => { errs[i.path[0] as keyof Errors] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep("submitting");

    const code = generateCode();
    const { error } = await supabase.from("bookings").insert({
      user_id: user?.id ?? null,
      confirmation_code: code,
      doctor_id: doctorId,
      doctor_name: doctorName,
      doctor_specialty: doctorSpecialty,
      doctor_address: address ?? null,
      appointment_date: format(date, "yyyy-MM-dd"),
      appointment_slot: slot,
      visit_type: type,
      price,
      patient_name: result.data.name,
      patient_email: result.data.email,
      patient_phone: result.data.phone,
      reason: result.data.reason || null,
    });

    if (error) {
      toast({ title: "Σφάλμα κράτησης", description: error.message, variant: "destructive" });
      setStep("details");
      return;
    }

    setConfirmationCode(code);
    setStep("success");
  };

  // Build appointment start/end (assumes slot is "HH:mm", default 30 min duration)
  const getAppointmentRange = () => {
    const [h, m] = slot.split(":").map(Number);
    const start = new Date(date);
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    return { start, end };
  };

  const formatICSDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const eventTitle = `Ραντεβού: ${doctorName} (${doctorSpecialty})`;
  const eventLocation = type === "in-person" ? (address ?? "") : "Τηλεϊατρική";
  const eventDescription = `Κράτηση μέσω iatreia.gr — Κωδικός: ${confirmationCode}. Κόστος: €${price}.`;

  const handleGoogleCalendar = () => {
    const { start, end } = getAppointmentRange();
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: eventTitle,
      dates: `${formatICSDate(start)}/${formatICSDate(end)}`,
      details: eventDescription,
      location: eventLocation,
    });
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  const handleDownloadICS = () => {
    const { start, end } = getAppointmentRange();
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//iatreia.gr//Booking//EL",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${confirmationCode}@iatreia.gr`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${eventTitle}`,
      `DESCRIPTION:${eventDescription.replace(/\n/g, "\\n")}`,
      `LOCATION:${eventLocation.replace(/,/g, "\\,")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${confirmationCode}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      setTimeout(() => {
        setStep("details");
        setForm({ name: "", email: "", phone: "", reason: "" });
        setErrors({});
      }, 200);
    }
    onOpenChange(o);
  };

  const SummaryRow = (
    <div className="rounded-lg border bg-muted/40 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-foreground">{doctorName}</div>
          <div className="text-xs text-muted-foreground">{doctorSpecialty}</div>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {type === "in-person" ? <><MapPin className="mr-1 h-3 w-3" /> Στο ιατρείο</> : <><Video className="mr-1 h-3 w-3" /> Τηλεϊατρική</>}
        </Badge>
      </div>
      <Separator className="my-2" />
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>{format(date, "EEEE d MMM", { locale: el })}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{slot}</span>
        </div>
      </div>
      <Separator className="my-2" />
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Κόστος επίσκεψης</span>
        <span className="font-bold text-foreground">€{price}</span>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {step === "success" ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 className="h-9 w-9 text-success" />
              </div>
              <DialogTitle className="text-center text-2xl">Το ραντεβού επιβεβαιώθηκε!</DialogTitle>
              <DialogDescription className="text-center">
                Σας στείλαμε τα στοιχεία στο <strong className="text-foreground">{form.email}</strong> και SMS στο {form.phone}.
              </DialogDescription>
            </DialogHeader>

            {SummaryRow}

            <div className="rounded-lg border border-dashed p-4 text-center">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Κωδικός κράτησης</div>
              <div className="mt-1 font-mono text-lg font-bold tracking-wider text-primary">{confirmationCode}</div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-center text-xs text-muted-foreground">
              {user ? (
                <>Όλες οι κρατήσεις σας είναι αποθηκευμένες στον λογαριασμό σας.{" "}
                  <Link to="/bookings" className="font-medium text-primary hover:underline" onClick={() => onOpenChange(false)}>
                    <ListOrdered className="mr-0.5 inline h-3 w-3" />Δείτε τα ραντεβού μου
                  </Link>
                </>
              ) : (
                <>Θέλετε να βλέπετε όλες τις κρατήσεις σας;{" "}
                  <Link to="/auth" className="font-medium text-primary hover:underline" onClick={() => onOpenChange(false)}>
                    Δημιουργήστε λογαριασμό
                  </Link>{" "}με το ίδιο email.
                </>
              )}
            </div>

            {address && type === "in-person" && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{address}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Προσθήκη στο ημερολόγιό σας</div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleGoogleCalendar}>
                  <CalendarPlus className="mr-1.5 h-4 w-4" /> Google Calendar
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleDownloadICS}>
                  <Download className="mr-1.5 h-4 w-4" /> Λήψη .ics
                </Button>
              </div>
            </div>

            <DialogFooter className="sm:justify-center">
              <Button onClick={() => handleClose(false)} className="w-full sm:w-auto">Τέλεια, ευχαριστώ!</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Στοιχεία ασθενούς</DialogTitle>
              <DialogDescription>Συμπληρώστε τα στοιχεία σας για να ολοκληρώσετε την κράτηση.</DialogDescription>
            </DialogHeader>

            {SummaryRow}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name"><User className="mr-1 inline h-3.5 w-3.5" /> Ονοματεπώνυμο *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Γιάννης Παπαδόπουλος" maxLength={100} disabled={step === "submitting"} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email"><Mail className="mr-1 inline h-3.5 w-3.5" /> Email *</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" maxLength={255} disabled={step === "submitting"} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone"><Phone className="mr-1 inline h-3.5 w-3.5" /> Τηλέφωνο *</Label>
                  <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+30 690 0000000" maxLength={20} disabled={step === "submitting"} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reason"><FileText className="mr-1 inline h-3.5 w-3.5" /> Λόγος επίσκεψης (προαιρετικό)</Label>
                <Textarea id="reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Σύντομη περιγραφή των συμπτωμάτων ή του λόγου επίσκεψης" maxLength={500} rows={3} disabled={step === "submitting"} />
                <p className="text-right text-[10px] text-muted-foreground">{form.reason.length}/500</p>
              </div>

              <p className="text-xs text-muted-foreground">
                Πατώντας «Επιβεβαίωση» αποδέχεστε τους όρους χρήσης και την πολιτική απορρήτου. Δωρεάν ακύρωση έως 24 ώρες πριν.
              </p>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={step === "submitting"}>Ακύρωση</Button>
                <Button type="submit" disabled={step === "submitting"}>
                  {step === "submitting" ? (<><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Επεξεργασία...</>) : "Επιβεβαίωση κράτησης"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
