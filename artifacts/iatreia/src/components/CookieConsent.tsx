import { useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, ChevronDown, ChevronUp, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const SESSION_KEY = "iatreia_cookie_consent_shown";

export type CookiePreferences = {
  necessary: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
};

interface ToggleProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (val: boolean) => void;
  label: string;
}

function Toggle({ checked, disabled, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={[
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-input",
        disabled ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

const CATEGORIES = [
  {
    key: "necessary" as const,
    label: "Απαραίτητα Cookies",
    description:
      "Αυτά τα cookies είναι απαραίτητα για τη βασική λειτουργία του ιστότοπου (σύνδεση, ασφάλεια, αποθήκευση προτιμήσεων). Δεν μπορούν να απενεργοποιηθούν.",
    alwaysOn: true,
  },
  {
    key: "analytics" as const,
    label: "Αναλυτικά Cookies",
    description:
      "Μας βοηθούν να κατανοούμε πώς οι επισκέπτες χρησιμοποιούν τον ιστότοπο. Τα δεδομένα συλλέγονται ανώνυμα και χρησιμεύουν για τη βελτίωση του περιεχομένου.",
    alwaysOn: false,
  },
  {
    key: "functional" as const,
    label: "Λειτουργικά Cookies",
    description:
      "Επιτρέπουν βελτιωμένες λειτουργίες και εξατομίκευση, όπως αποθήκευση προτιμήσεων γλώσσας ή περιοχής.",
    alwaysOn: false,
  },
  {
    key: "marketing" as const,
    label: "Marketing Cookies",
    description:
      "Χρησιμοποιούνται για την εμφάνιση σχετικών διαφημίσεων και την παρακολούθηση της αποτελεσματικότητας διαφημιστικών καμπανιών.",
    alwaysOn: false,
  },
];

export function CookieConsent() {
  const [visible, setVisible] = useState(
    () => !sessionStorage.getItem(SESSION_KEY)
  );
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState({
    analytics: false,
    functional: false,
    marketing: false,
  });

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Ρυθμίσεις cookies"
    >
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border bg-background shadow-2xl ring-1 ring-black/5">

        {/* Header */}
        <div className="flex items-start gap-3 p-5 pb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold">Ρυθμίσεις Απορρήτου & Cookies</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Χρησιμοποιούμε cookies για τη βασική λειτουργία του ιστότοπου και — με τη
              συγκατάθεσή σας — για αναλυτικά στοιχεία και εξατομίκευση. Σύμφωνα με τον{" "}
              <strong className="text-foreground">GDPR (ΕΕ 2016/679)</strong> και τον{" "}
              <strong className="text-foreground">Ν. 4624/2019</strong> έχετε δικαίωμα επιλογής.{" "}
              <Link
                to="/privacy"
                className="font-medium text-primary underline-offset-2 hover:underline"
                onClick={dismiss}
              >
                Πολιτική Απορρήτου ↗
              </Link>
            </p>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Κλείσιμο (αποδοχή μόνο απαραίτητων)"
            title="Κλείσιμο — αποδοχή μόνο απαραίτητων cookies"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Expandable category list */}
        {expanded && (
          <div className="border-t px-5 py-4 space-y-4 bg-muted/20">
            {CATEGORIES.map((cat) => (
              <div key={cat.key} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold">{cat.label}</span>
                    {cat.alwaysOn && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        <ShieldCheck className="h-2.5 w-2.5" /> Πάντα ενεργά
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {cat.description}
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  <Toggle
                    checked={cat.alwaysOn || (prefs[cat.key as keyof typeof prefs] ?? false)}
                    disabled={cat.alwaysOn}
                    label={cat.label}
                    onChange={(val) => {
                      if (!cat.alwaysOn) {
                        setPrefs((p) => ({ ...p, [cat.key]: val }));
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action bar */}
        <div className="flex flex-col gap-2 border-t bg-muted/30 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {expanded
              ? <><ChevronUp className="h-3.5 w-3.5" /> Απόκρυψη επιλογών</>
              : <><ChevronDown className="h-3.5 w-3.5" /> Προσαρμογή επιλογών</>
            }
          </button>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={dismiss} className="h-7 text-xs">
              Μόνο Απαραίτητα
            </Button>
            {expanded && (
              <Button variant="outline" size="sm" onClick={dismiss} className="h-7 text-xs">
                Αποθήκευση Επιλογών
              </Button>
            )}
            <Button size="sm" onClick={dismiss} className="h-7 text-xs">
              Αποδοχή Όλων
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
