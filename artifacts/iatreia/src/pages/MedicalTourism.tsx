import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Plane, ShieldCheck, Banknote, Languages, Stethoscope, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const treatments = [
  "Dental implants",
  "IVF / Fertility",
  "Cosmetic surgery",
  "Orthopaedics",
  "Bariatric surgery",
  "Eye surgery (LASIK)",
  "Hair transplant",
  "Other",
];

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const MedicalTourism = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const treatmentRef = useRef<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name") as string,
          email: fd.get("email") as string,
          subject: `Medical Tourism Quote – ${treatmentRef.current || "General"}`,
          message: [
            `Country: ${fd.get("country") ?? ""}`,
            `Phone: ${fd.get("phone") ?? ""}`,
            `Treatment: ${treatmentRef.current || "Not specified"}`,
            ``,
            (fd.get("msg") as string) || "",
          ].join("\n").trim(),
          treatment: treatmentRef.current || undefined,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setSubmitted(true);
    } catch {
      toast.error("Could not send your request. Please email us directly at hello@iatreia.gr");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              iatreia<span className="text-primary">.gr</span>
            </span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-16 text-primary-foreground lg:py-24">
          <Badge className="mb-4 border-white/20 bg-white/10 text-white hover:bg-white/20">
            <Plane className="mr-1 h-3 w-3" /> Medical Tourism · Greece
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
            World-class healthcare under the Greek sun
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            Combine premium medical treatment with a holiday in Greece. Save up to 70% versus Northern Europe — without
            compromising on quality.
          </p>
        </div>
      </section>

      <section className="border-b py-16">
        <div className="container mx-auto grid gap-6 px-4 md:grid-cols-3">
          {[
            { icon: Banknote, t: "Up to 70% savings", d: "Average prices vs UK / Germany / Scandinavia" },
            { icon: ShieldCheck, t: "JCI-certified facilities", d: "Hospitals & clinics meeting international standards" },
            { icon: Languages, t: "English-speaking team", d: "Doctors, nurses and patient coordinators" },
          ].map((p) => (
            <Card key={p.t} className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
                <p.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{p.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.d}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">How it works</h2>
            <ol className="mt-8 space-y-6">
              {[
                { n: "01", t: "Tell us what you need", d: "Fill the form with your treatment, timing and any medical history." },
                { n: "02", t: "Get matched with 3 doctors", d: "Personalised quotes from JCI-certified clinics within 24h." },
                { n: "03", t: "Plan your trip", d: "We help with appointments, hotels, transfers and translation." },
                { n: "04", t: "Treatment & follow-up", d: "Recover under our care with virtual follow-ups when you're back home." },
              ].map((s) => (
                <li key={s.n} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
                    {s.n}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{s.t}</h3>
                    <p className="text-sm text-muted-foreground">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <Card className="p-8" id="quote">
            {submitted ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <CheckCircle2 className="mb-4 h-16 w-16 text-success" />
                <h3 className="text-2xl font-bold text-foreground">Thank you!</h3>
                <p className="mt-2 text-muted-foreground">
                  We've received your request. A patient coordinator will email you within 24 hours.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-foreground">Get a free quote</h3>
                <p className="mt-1 text-sm text-muted-foreground">No obligation. Reply within 24 hours.</p>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Full name</Label>
                      <Input id="name" name="name" required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" name="country" required placeholder="United Kingdom" className="mt-1" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" type="tel" className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="treatment">Treatment</Label>
                    <Select onValueChange={(v) => { treatmentRef.current = v; }}>
                      <SelectTrigger id="treatment" className="mt-1">
                        <SelectValue placeholder="Select a treatment" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatments.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="msg">Tell us more (optional)</Label>
                    <Textarea id="msg" name="msg" rows={4} className="mt-1" placeholder="Symptoms, preferred dates, special needs…" />
                  </div>
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? "Sending…" : "Request my free quote"}
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
};

export default MedicalTourism;
