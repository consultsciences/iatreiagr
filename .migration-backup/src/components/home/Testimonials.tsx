import { Quote, Star } from "lucide-react";
import { Card } from "@/components/ui/card";

const reviews = [
  {
    name: "Ελένη Α.",
    date: "Ιανουάριος 2026",
    text: "Με εξυπηρετήσατε ακόμη και Κυριακή. Αυτό και μόνο μου φτάνει. Ευχαριστώ πολύ!",
  },
  {
    name: "Παναγιώτης Κ.",
    date: "Φεβρουάριος 2026",
    text: "Θα σταματήσω να χρησιμοποιώ το iatreia.gr… όταν τολμήσει κάποιος να αλλάξει το παραμικρό. Είστε υπέροχοι.",
  },
  {
    name: "Βιργινία Τ.",
    date: "Μάρτιος 2026",
    text: "Η πλατφόρμα είναι τρομερά εύχρηστη και οι αξιολογήσεις αποτελούν βασική προϋπόθεση επιλογής ειδικού!",
  },
  {
    name: "Κωνσταντίνος Σ.",
    date: "Απρίλιος 2026",
    text: "Τέλειο για εμάς τα άτομα με απώλεια ακοής στο να κλείνουμε ηλεκτρονικά τα ραντεβού μας.",
  },
];

const Testimonials = () => (
  <section className="py-16">
    <div className="container mx-auto px-4">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Ιστορίες που μας εμπνέουν</h2>
        <p className="mt-2 text-muted-foreground">
          Πάνω από <span className="font-semibold text-foreground">2,8 εκατομμύρια</span> άνθρωποι είναι πιο υγιείς και χαρούμενοι
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {reviews.map((r) => (
          <Card key={r.name} className="relative p-6">
            <Quote className="absolute right-4 top-4 h-8 w-8 text-accent" />
            <div className="mb-3 flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-warning text-warning" />
              ))}
            </div>
            <p className="mb-6 text-sm leading-relaxed text-foreground">"{r.text}"</p>
            <div className="border-t pt-4">
              <div className="font-semibold text-foreground">{r.name}</div>
              <div className="text-xs text-muted-foreground">{r.date}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
