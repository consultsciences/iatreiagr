import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Plus, ShieldCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { useUser, useClerk } from "@clerk/clerk-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const nav = [
  { to: "/spaces", label: "Ιατρικοί Χώροι" },
  { to: "/equipment", label: "Εξοπλισμός" },
  { to: "/jobs", label: "Θέσεις Εργασίας" },
  { to: "/supplies", label: "Αναλώσιμα" },
  { to: "/services", label: "Υπηρεσίες & Συνεργάτες" },
  { to: "/clinic-launch", label: "Ανοίξτε Ιατρείο" },
  { to: "/pricing", label: "Πακέτα" },
];

export const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  const { user, isLoaded } = useUser();
  const { signOut, session } = useClerk();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user || !session) { setIsAdmin(false); return; }
    session.getToken().then((token) => {
      fetch(`${BASE}/api/admin/roles/check`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((r) => r.ok ? r.json() : { is_admin: false })
        .then((d) => setIsAdmin(d.is_admin === true))
        .catch(() => setIsAdmin(false));
    });
  }, [user, session]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Clerk network error — continue with local redirect
    }
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Logo size="lg" />

        <nav className="hidden items-center gap-1 xl:flex">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-foreground/75 hover:text-primary",
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isLoaded && user ? (
            <>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex text-primary">
                  <Link to="/admin">
                    <ShieldCheck className="mr-1.5 h-4 w-4" /> Διαχείριση
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={handleSignOut}>
                <LogOut className="mr-1.5 h-4 w-4" /> Αποσύνδεση
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link to="/auth">Σύνδεση</Link>
            </Button>
          )}
          <Button asChild size="sm" className="hidden sm:inline-flex bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/post">
              <Plus className="mr-1.5 h-4 w-4" /> Καταχώριση Αγγελίας
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Μενού"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t bg-background xl:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium",
                    isActive ? "bg-accent/10 text-primary" : "text-foreground/80 hover:bg-muted",
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
            <div className="my-2 border-t" />
            {isLoaded && user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-primary">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Διαχείριση
                  </Link>
                )}
                <button onClick={() => { setOpen(false); handleSignOut(); }} className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-foreground/80">
                  Αποσύνδεση
                </button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80">
                Σύνδεση
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
