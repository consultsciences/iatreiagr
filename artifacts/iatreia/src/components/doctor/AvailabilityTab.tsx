import { Plus, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AvailabilitySlot as AvailabilitySlotRecord } from "@workspace/types";

export type { AvailabilitySlotRecord };

const DAYS = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];

interface Slot { day_of_week: number; start_time: string; end_time: string; }

interface Props {
  availability: AvailabilitySlotRecord[];
  newSlot: Slot;
  setNewSlot: (s: Slot) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

const AvailabilityTab = ({ availability, newSlot, setNewSlot, onAdd, onRemove }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle>Ωράριο</CardTitle>
      <CardDescription>Ορίστε τα διαθέσιμα ωράρια ραντεβού.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <Label className="text-xs">Ημέρα</Label>
          <Select value={String(newSlot.day_of_week)} onValueChange={(v) => setNewSlot({ ...newSlot, day_of_week: Number(v) })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Από</Label>
          <Input type="time" value={newSlot.start_time} onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Έως</Label>
          <Input type="time" value={newSlot.end_time} onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })} />
        </div>
        <div className="flex items-end">
          <Button onClick={onAdd} className="w-full"><Plus className="mr-2 h-4 w-4" />Προσθήκη</Button>
        </div>
      </div>
      <div className="space-y-2">
        {availability.length === 0 && <p className="text-sm text-muted-foreground">Δεν έχετε ορίσει ωράριο ακόμη.</p>}
        {availability.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-md border bg-card p-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{DAYS[s.day_of_week]}</span>
              <span className="text-sm text-muted-foreground">{s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onRemove(s.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default AvailabilityTab;
