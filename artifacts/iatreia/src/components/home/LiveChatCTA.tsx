import { Video, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const LiveChatCTA = () => (
  <section className="py-16">
    <div className="container mx-auto px-4">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="group relative overflow-hidden border-2 p-8 transition-all hover:border-primary hover:shadow-[var(--shadow-elevated)]">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Live τώρα
          </div>
          <h3 className="text-2xl font-bold text-foreground">Live chat με γιατρό</h3>
          <p className="mt-2 text-muted-foreground">
            Στείλε μήνυμα σε γενικό ιατρό και πάρε απάντηση σε λιγότερο από 5 λεπτά. Διαθέσιμο 24/7.
          </p>
          <Button className="mt-6">Ξεκίνα συνομιλία</Button>
        </Card>
        <Card className="group relative overflow-hidden border-2 p-8 transition-all hover:border-primary hover:shadow-[var(--shadow-elevated)]">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
            <Video className="h-6 w-6" />
          </div>
          <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning">
            <Zap className="h-3 w-3" /> Άμεσα
          </div>
          <h3 className="text-2xl font-bold text-foreground">Άμεση βιντεοκλήση</h3>
          <p className="mt-2 text-muted-foreground">
            Συνδέσου με διαθέσιμο γιατρό σε &lt; 15 λεπτά για συνταγογράφηση, παραπεμπτικά ή δεύτερη γνώμη.
          </p>
          <Button variant="outline" className="mt-6">Ξεκίνα κλήση</Button>
        </Card>
      </div>
    </div>
  </section>
);

export default LiveChatCTA;
