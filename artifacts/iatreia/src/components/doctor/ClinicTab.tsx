import { useMemo } from "react";
import { Building2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { privateClinics } from "@/data/privateClinics";

interface Props {
  claims: any[];
  clinicQuery: string;
  setClinicQuery: (q: string) => void;
  onClaim: (clinicId: string) => void;
  onRemoveClaim: (id: string) => void;
}

const ClinicTab = ({ claims, clinicQuery, setClinicQuery, onClaim, onRemoveClaim }: Props) => {
  const filteredClinics = useMemo(() => {
    const q = clinicQuery.trim().toLowerCase();
    if (!q) return [];
    return privateClinics
      .filter((c) => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q))
      .slice(0, 8);
  }, [clinicQuery]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Κλινική</CardTitle>
        <CardDescription>Διεκδικήστε τη διαχείριση μιας κλινικής από τον κατάλογο.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Αναζήτηση κλινικής</Label>
          <Input placeholder="Όνομα ή διεύθυνση..." value={clinicQuery} onChange={(e) => setClinicQuery(e.target.value)} />
        </div>
        {filteredClinics.length > 0 && (
          <div className="space-y-2">
            {filteredClinics.map((c) => {
              const claimed = claims.some((cl) => cl.clinic_id === String(c.id));
              return (
                <div key={c.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.address}</p>
                    </div>
                  </div>
                  <Button size="sm" variant={claimed ? "secondary" : "default"} disabled={claimed} onClick={() => onClaim(String(c.id))}>
                    {claimed ? "Σε εκκρεμότητα" : "Διεκδίκηση"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        {claims.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Τα αιτήματά σας</h3>
            <div className="space-y-2">
              {claims.map((cl) => {
                const clinic = privateClinics.find((c) => String(c.id) === cl.clinic_id);
                return (
                  <div key={cl.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">{clinic?.name ?? cl.clinic_id}</p>
                      <p className="text-xs text-muted-foreground">Κατάσταση: {cl.status}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onRemoveClaim(cl.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClinicTab;
