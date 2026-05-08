import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

const cols = [
  {
    title: "Αγορά",
    links: [
      { to: "/spaces", label: "Ιατρικοί Χώροι" },
      { to: "/equipment", label: "Εξοπλισμός" },
      { to: "/jobs", label: "Θέσεις Εργασίας" },
      { to: "/supplies", label: "Αναλώσιμα" },
      { to: "/services", label: "Υπηρεσίες & Συνεργάτες" },
    ],
  },
  {
    title: "Καταχωρητές",
    links: [
      { to: "/post", label: "Καταχώριση αγγελίας" },
      { to: "/pricing", label: "Πακέτα & Τιμές" },
      { to: "/clinic-launch", label: "Άνοιγμα Ιατρείου" },
      { to: "/auth", label: "Σύνδεση / Εγγραφή" },
    ],
  },
  {
    title: "Εταιρεία",
    links: [
      { to: "/about", label: "Σχετικά" },
      { to: "/contact", label: "Επικοινωνία" },
      { to: "/blog", label: "Blog & Οδηγοί" },
      { to: "/en", label: "English" },
    ],
  },
  {
    title: "Νομικά",
    links: [
      { to: "/terms", label: "Όροι χρήσης" },
      { to: "/privacy", label: "Πολιτική απορρήτου" },
      { to: "/listings-policy", label: "Πολιτική αγγελιών" },
      { to: "/report", label: "Αναφορά αγγελίας" },
    ],
  },
];

export const SiteFooter = () => (
  <footer className="border-t bg-secondary/40">
    <div className="container mx-auto px-4 py-14">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <div className="mb-3">
            <Logo size="md" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Η εξειδικευμένη ελληνική πλατφόρμα αγγελιών για χώρους, εξοπλισμό, προσωπικό
            και υπηρεσίες υγείας.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="mb-3 text-sm font-semibold tracking-wide text-foreground">{c.title}</h4>
            <ul className="space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-muted-foreground hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
    <div className="border-t bg-background/60">
      <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground md:flex-row">
        <span>© {new Date().getFullYear()} iatreia.gr — Με επιφύλαξη παντός δικαιώματος.</span>
        <span>Πλατφόρμα αγγελιών — δεν διεκπεραιώνει συναλλαγές προϊόντων.</span>
      </div>
    </div>
  </footer>
);
