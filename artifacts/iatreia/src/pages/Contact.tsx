import { Mail, Phone, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b py-14" style={{ background: "var(--gradient-soft)" }}>
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <Badge variant="secondary" className="mb-4">Επικοινωνία</Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Πώς μπορούμε να βοηθήσουμε;</h1>
          <p className="mt-4 text-muted-foreground">
            Στείλτε μας μήνυμα — απαντάμε εντός 1 εργάσιμης ημέρας.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[1.3fr_1fr]">
          <Card className="p-6">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                toast({ title: "Το μήνυμα στάλθηκε", description: "Σας ευχαριστούμε. Θα επικοινωνήσουμε σύντομα." });
                (e.target as HTMLFormElement).reset();
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Όνομα</Label>
                  <Input id="name" required maxLength={100} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required maxLength={255} className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label htmlFor="subject">Θέμα</Label>
                <Input id="subject" required maxLength={150} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="message">Μήνυμα</Label>
                <Textarea id="message" required maxLength={2000} rows={6} className="mt-1.5" />
              </div>
              <Button type="submit" size="lg">Αποστολή μηνύματος</Button>
            </form>
          </Card>

          <div className="space-y-4">
            <Card className="p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold">Email</div>
              <a href="mailto:hello@iatreia.gr" className="text-sm text-muted-foreground hover:text-primary">hello@iatreia.gr</a>
            </Card>
            <Card className="p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Phone className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold">Τηλέφωνο</div>
              <div className="text-sm text-muted-foreground">+30 210 000 0000</div>
            </Card>
            <Card className="p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold">Έδρα</div>
              <div className="text-sm text-muted-foreground">Αθήνα, Ελλάδα</div>
            </Card>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
};

export default Contact;
