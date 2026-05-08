import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Badge } from "@/components/ui/badge";

const LAST_UPDATED = "8 Μαΐου 2026";

const ListingsPolicy = () => {
  useEffect(() => { document.title = "Πολιτική Αγγελιών | iatreia.gr"; }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b py-12" style={{ background: "var(--gradient-soft)" }}>
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <Badge variant="secondary" className="mb-4">Νομικά</Badge>
          <h1 className="text-4xl font-bold tracking-tight">Πολιτική Αγγελιών</h1>
          <p className="mt-3 text-sm text-muted-foreground">Τελευταία ενημέρωση: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto max-w-3xl px-4 space-y-10 text-sm leading-relaxed text-foreground/90">

          <div>
            <p>
              Η παρούσα Πολιτική Αγγελιών ορίζει τους κανόνες για την ανάρτηση περιεχομένου στην
              πλατφόρμα <strong>iatreia.gr</strong>, που λειτουργεί από την{" "}
              <strong>Consult Sciences Ltd</strong> (Λονδίνο, Ηνωμένο Βασίλειο). Με την ανάρτηση
              αγγελίας αποδέχεστε ανεπιφύλακτα την παρούσα Πολιτική και τους{" "}
              <Link to="/terms" className="text-primary underline-offset-2 hover:underline">Όρους Χρήσης</Link>.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">1. Επιτρεπόμενες Κατηγορίες Αγγελιών</h2>
            <p className="mb-2">Η πλατφόρμα δέχεται αγγελίες αποκλειστικά στις ακόλουθες κατηγορίες:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Ιατρικοί Χώροι:</strong> ιατρεία, κλινικές, εξεταστήρια, χώροι σε ιατρικά κέντρα.</li>
              <li><strong>Ιατρικός Εξοπλισμός:</strong> αναλυτές, απεικονιστικά, ιατρικές συσκευές, έπιπλα ιατρείου.</li>
              <li><strong>Θέσεις Εργασίας:</strong> ιατρικό και παραϊατρικό προσωπικό, διοικητικό προσωπικό κλινικών.</li>
              <li><strong>Ιατρικά Αναλώσιμα:</strong> αναλώσιμα υγείας, φαρμακευτικά υλικά (εντός νομίμων ορίων).</li>
              <li><strong>Υπηρεσίες & Συνεργάτες:</strong> λογιστικές, νομικές, ασφαλιστικές, ψηφιακές υπηρεσίες για κλινικές.</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">2. Απαιτήσεις Ποιότητας Αγγελιών</h2>
            <p className="mb-2">Κάθε αγγελία οφείλει να:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Περιγράφει με ακρίβεια το αντικείμενό της — απαγορεύεται η παραπλανητική ή υπερβολική διατύπωση.</li>
              <li>Αναφέρει τιμή ή εύρος τιμής (εφόσον πρόκειται για πώληση/ενοικίαση).</li>
              <li>Περιέχει έγκυρα στοιχεία επικοινωνίας.</li>
              <li>Αφορά ένα και μόνο αντικείμενο ή σαφώς ορισμένο σύνολο αντικειμένων.</li>
              <li>Συνοδεύεται, εφόσον υπάρχει, από πρωτότυπες (μη κλεμμένες) φωτογραφίες.</li>
              <li>Είναι γραμμένη στην ελληνική ή/και αγγλική γλώσσα.</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">3. Απαγορευμένο Περιεχόμενο</h2>
            <p className="mb-2">Απαγορεύεται ρητά η ανάρτηση αγγελιών που:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Αφορούν προϊόντα ή υπηρεσίες εκτός του τομέα υγείας.</li>
              <li>Περιέχουν ψευδείς, παραπλανητικές ή ανακριβείς πληροφορίες.</li>
              <li>Προσφέρουν ρυθμιστικά ελεγχόμενα φαρμακευτικά προϊόντα εκτός νόμιμων διαύλων.</li>
              <li>Παραβιάζουν δικαιώματα πνευματικής ιδιοκτησίας τρίτων (φωτογραφίες stock χωρίς άδεια κ.λπ.).</li>
              <li>Περιέχουν διαφημιστικό υλικό προσωπικής φύσης ή ανεπιθύμητη αλληλογραφία (spam).</li>
              <li>Παραβιάζουν δεδομένα προσωπικού χαρακτήρα τρίτων.</li>
              <li>Προωθούν παράνομες δραστηριότητες ή προϊόντα υπό κανονιστικό αποκλεισμό.</li>
              <li>Εμπεριέχουν υποτιμητικό, ρατσιστικό ή προσβλητικό περιεχόμενο.</li>
              <li>Αποτελούν διπλότυπο υπαρχουσών αγγελιών του ίδιου χρήστη.</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">4. Διαδικασία Ελέγχου και Έγκρισης</h2>
            <p>
              Κάθε αγγελία υπόκειται σε έλεγχο (moderation) από την ομάδα μας προτού δημοσιευτεί.
              Ο χρόνος ελέγχου είναι συνήθως εντός 1 εργάσιμης ημέρας. Η Εταιρεία διατηρεί το δικαίωμα
              να:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Εγκρίνει, απορρίψει ή ζητήσει τροποποίηση αγγελίας χωρίς υποχρέωση αιτιολόγησης.</li>
              <li>Αφαιρέσει αγγελία που ήδη δημοσιεύτηκε, εφόσον διαπιστωθεί παραβίαση.</li>
              <li>Αναστείλει λογαριασμό χρήστη που επαναλαμβάνει παραβιάσεις.</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">5. Διάρκεια Αγγελιών</h2>
            <p>
              Οι δημοσιευμένες αγγελίες παραμένουν ενεργές για το χρονικό διάστημα που ορίζει το πακέτο
              που επιλέξατε ή έως ότου τις αφαιρέσετε μόνοι σας. Αγγελίες που δεν ανανεώνονται
              αρχειοθετούνται αυτόματα μετά τη λήξη της περιόδου τους.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">6. Ευθύνη Καταχωρητή</h2>
            <p>
              Ο καταχωρητής της αγγελίας φέρει αποκλειστική ευθύνη για την ακρίβεια, νομιμότητα και
              πληρότητα του περιεχομένου της. Η Εταιρεία ενεργεί ως ουδέτερη ενδιάμεση πλατφόρμα και
              δεν εγγυάται την ποιότητα ή διαθεσιμότητα οποιουδήποτε προϊόντος ή υπηρεσίας που
              διαφημίζεται. Οποιαδήποτε συναλλαγή προκύπτει από αγγελία αφορά αποκλειστικά τα
              εμπλεκόμενα μέρη.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">7. Αναφορά Παραβατικής Αγγελίας</h2>
            <p>
              Αν εντοπίσετε αγγελία που παραβιάζει την παρούσα Πολιτική, μπορείτε να τη{" "}
              <Link to="/report" className="text-primary underline-offset-2 hover:underline">αναφέρετε εδώ</Link>.
              Η ομάδα μας εξετάζει κάθε καταγγελία και λαμβάνει τα κατάλληλα μέτρα.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">8. Επικοινωνία</h2>
            <p>
              Για ερωτήματα σχετικά με την Πολιτική Αγγελιών επικοινωνήστε μαζί μας μέσω της{" "}
              <Link to="/contact" className="text-primary underline-offset-2 hover:underline">φόρμας επικοινωνίας</Link>.
            </p>
          </div>

        </div>
      </section>
      <SiteFooter />
    </div>
  );
};

export default ListingsPolicy;
