import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props { bookings: any[]; }

const BookingsTab = ({ bookings }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle>Ραντεβού ({bookings.length})</CardTitle>
      <CardDescription>Όλα τα ραντεβού που έχουν κλειστεί για εσάς.</CardDescription>
    </CardHeader>
    <CardContent>
      {bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground">Δεν υπάρχουν ραντεβού ακόμη.</p>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{b.patient_name}</p>
                  <p className="text-sm text-muted-foreground">{b.appointment_date} · {b.appointment_slot} · {b.visit_type}</p>
                </div>
                <Badge variant={b.status === "active" ? "default" : "secondary"}>{b.status}</Badge>
              </div>
              {b.reason && <p className="mt-2 text-sm">{b.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default BookingsTab;
