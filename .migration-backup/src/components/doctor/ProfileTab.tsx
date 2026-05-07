import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type Profile = {
  full_name: string;
  specialty: string | null;
  bio: string | null;
  photo_url: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  clinic_id: string | null;
  is_published: boolean;
};

interface Props {
  profile: Profile;
  setProfile: (p: Profile) => void;
  saving: boolean;
  onSave: () => void;
}

const ProfileTab = ({ profile, setProfile, saving, onSave }: Props) => (
  <Card id="doctor-profile-card">
    <CardHeader>
      <CardTitle>Δημόσιο προφίλ</CardTitle>
      <CardDescription>Αυτές οι πληροφορίες εμφανίζονται στους ασθενείς.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Ονοματεπώνυμο</Label>
          <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Ειδικότητα</Label>
          <Input value={profile.specialty ?? ""} onChange={(e) => setProfile({ ...profile, specialty: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Τηλέφωνο</Label>
          <Input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Email επικοινωνίας</Label>
          <Input value={profile.email ?? ""} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Διεύθυνση</Label>
          <Input value={profile.address ?? ""} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Πόλη</Label>
          <Input value={profile.city ?? ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>URL Φωτογραφίας</Label>
          <Input value={profile.photo_url ?? ""} onChange={(e) => setProfile({ ...profile, photo_url: e.target.value })} placeholder="https://…" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Βιογραφικό</Label>
          <Textarea rows={5} value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <Label className="text-sm">Δημοσιευμένο προφίλ</Label>
          <p className="text-xs text-muted-foreground">Εμφάνιση στα αποτελέσματα αναζήτησης.</p>
        </div>
        <Switch checked={profile.is_published} onCheckedChange={(v) => setProfile({ ...profile, is_published: v })} />
      </div>
      <Button onClick={onSave} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Αποθήκευση
      </Button>
    </CardContent>
  </Card>
);

export default ProfileTab;
