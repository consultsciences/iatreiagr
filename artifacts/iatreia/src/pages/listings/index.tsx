import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";
import { ListingCategoryPage } from "./ListingCategoryPage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const DISCLAIMERS = {
  spaces: "Το iatreia.gr φιλοξενεί αγγελίες ακινήτων και δεν παρέχει μεσιτικές, νομικές ή τεχνικές υπηρεσίες. Ο ενδιαφερόμενος οφείλει να ελέγξει απευθείας με τον ιδιοκτήτη, μεσίτη ή σύμβουλο την καταλληλότητα, τη χρήση, τις άδειες και τους όρους μίσθωσης ή αγοράς.",
  equipment: "Το iatreia.gr φιλοξενεί αγγελίες τρίτων και δεν πωλεί, ελέγχει, πιστοποιεί ή εγγυάται τον εξοπλισμό. Ο ενδιαφερόμενος οφείλει να επιβεβαιώσει την κατάσταση, την καταλληλότητα, τα συνοδευτικά έγγραφα, τη συμμόρφωση και τους όρους αγοράς ή μίσθωσης απευθείας με τον καταχωρητή.",
  jobs: "Το iatreia.gr φιλοξενεί αγγελίες εργασίας τρίτων. Οι όροι συνεργασίας, οι αμοιβές και η διαδικασία επιλογής καθορίζονται αποκλειστικά από τον εργοδότη.",
  supplies: "Το iatreia.gr παρουσιάζει προμηθευτές και δεν πραγματοποιεί πωλήσεις. Όλες οι παραγγελίες, οι όροι και οι πληρωμές γίνονται απευθείας με τον προμηθευτή.",
  services: "Το iatreia.gr παρουσιάζει παρόχους υπηρεσιών χωρίς να εγγυάται ή να μεσολαβεί. Συμβουλευτείτε απευθείας τον πάροχο για όρους, χρόνους και τιμές.",
};

const ServicesCTA = () => (
  <Card className="mb-6 flex flex-col items-center gap-4 border-primary/20 bg-primary/5 p-6 text-center sm:flex-row sm:text-left">
    <Star className="h-10 w-10 shrink-0 text-primary" />
    <div className="flex-1">
      <p className="font-bold text-foreground">Είστε πάροχος υπηρεσιών;</p>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Αποκτήστε αφιερωμένη σελίδα με περιγραφή, πρόταση συνεργασίας & φόρμα επικοινωνίας. Από €999.
      </p>
    </div>
    <Button asChild className="shrink-0">
      <Link to="/advertise?type=services">
        Καταχωρίστε τώρα <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  </Card>
);

export const SpacesPage = () => (
  <ListingCategoryPage
    category="spaces"
    title="Ιατρικοί Χώροι προς Ενοικίαση & Πώληση"
    subtitle="Ιατρεία, οδοντιατρεία, διαγνωστικά κέντρα, εργαστήρια και turnkey κλινικοί χώροι σε όλη την Ελλάδα."
    disclaimer={DISCLAIMERS.spaces}
  />
);

export const EquipmentPage = () => (
  <ListingCategoryPage
    category="equipment"
    title="Ιατρικός & Οδοντιατρικός Εξοπλισμός"
    subtitle="Νέος, μεταχειρισμένος και refurbished εξοπλισμός. Επιλογές αγοράς, leasing και ενοικίασης."
    disclaimer={DISCLAIMERS.equipment}
  />
);

export const JobsPage = () => (
  <ListingCategoryPage
    category="jobs"
    title="Θέσεις Εργασίας στον Χώρο της Υγείας"
    subtitle="Ιατροί, οδοντίατροι, νοσηλευτές, τεχνολόγοι και διοικητικό προσωπικό σε ιατρεία και κλινικές."
    disclaimer={DISCLAIMERS.jobs}
  />
);

export const SuppliesPage = () => (
  <ListingCategoryPage
    category="supplies"
    title="Αναλώσιμα, Προμηθευτές & Έπιπλα"
    subtitle="Κατάλογοι προμηθευτών για αναλώσιμα, στειρωτικά, PPE και έπιπλα ιατρείου."
    disclaimer={DISCLAIMERS.supplies}
  />
);

export const ServicesPage = () => (
  <ListingCategoryPage
    category="services"
    title="Υπηρεσίες & Συνεργάτες"
    subtitle="Τράπεζες, leasing, αδειοδότηση, κατασκευή, νομικοί, λογιστές και άλλοι B2B συνεργάτες."
    disclaimer={DISCLAIMERS.services}
    headerSlot={<ServicesCTA />}
  />
);
