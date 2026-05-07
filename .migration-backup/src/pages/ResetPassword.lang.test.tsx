import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

const onAuthStateChangeMock = vi.fn();
const getSessionMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (...args: unknown[]) => onAuthStateChangeMock(...args),
      getSession: () => getSessionMock(),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

import ResetPassword from "./ResetPassword";

const setLocation = (href: string) => {
  const url = new URL(href);
  Object.defineProperty(window, "location", {
    writable: true,
    value: {
      ...window.location,
      href: url.href,
      origin: url.origin,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
    },
  });
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>,
  );

/**
 * Greek strings actually rendered by the page. Each must reach the
 * assistive technology layer as real text content with the document's
 * `lang="el"` in effect (so screen readers pick a Greek voice/dictionary).
 */
const GREEK_STRINGS = [
  "Ορισμός νέου κωδικού",
  "Εισάγετε τον νέο σας κωδικό πρόσβασης.",
  "Μη έγκυρος ή ληγμένος σύνδεσμος",
  "Αίτηση νέου συνδέσμου",
  "Επιστροφή στη σύνδεση",
] as const;

/** Walk up the tree and find the nearest ancestor (or self) with a `lang` attribute. */
const effectiveLang = (el: Element | null): string | null => {
  let node: Element | null = el;
  while (node) {
    const lang = node.getAttribute("lang");
    if (lang) return lang;
    node = node.parentElement;
  }
  return document.documentElement.getAttribute("lang");
};

/** Walk up the tree and check whether any ancestor hides this node from AT. */
const isHiddenFromAssistiveTech = (el: Element | null): boolean => {
  let node: Element | null = el;
  while (node) {
    if (node.getAttribute("aria-hidden") === "true") return true;
    if (node.hasAttribute("hidden")) return true;
    node = node.parentElement;
  }
  return false;
};

describe("ResetPassword — accessible language metadata for Greek copy", () => {
  let originalLang: string;

  beforeEach(() => {
    originalLang = document.documentElement.getAttribute("lang") ?? "";
    // Mirror production: index.html ships with <html lang="el">. jsdom
    // defaults to "" so we set it explicitly for a faithful test.
    document.documentElement.setAttribute("lang", "el");

    navigateMock.mockReset();
    onAuthStateChangeMock.mockReset();
    onAuthStateChangeMock.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    getSessionMock.mockReset();
    getSessionMock.mockResolvedValue({ data: { session: null } });
    window.localStorage.clear();
  });

  afterEach(() => {
    document.documentElement.setAttribute("lang", originalLang);
  });

  it("invalid-link notice: every Greek string resolves to lang='el' and is not aria-hidden", async () => {
    setLocation(
      "https://app.example.com/reset-password#error=access_denied&error_description=Email+link+is+invalid+or+has+expired",
    );
    renderPage();

    // Wait until the alert (and therefore all Greek copy) is mounted.
    await screen.findByRole("alert");

    // The page must not flip the document language away from Greek.
    expect(document.documentElement.getAttribute("lang")).toBe("el");

    for (const text of GREEK_STRINGS) {
      const matches = screen.getAllByText(text);
      expect(matches.length).toBeGreaterThan(0);
      for (const node of matches) {
        // 1. Effective language for this node must be Greek so screen
        //    readers select a Greek voice / pronunciation dictionary.
        expect(effectiveLang(node)).toBe("el");

        // 2. No ancestor may hide the Greek text from assistive tech.
        expect(isHiddenFromAssistiveTech(node)).toBe(false);

        // 3. The element itself must not declare a non-Greek language
        //    that would mislead the screen reader.
        const ownLang = node.getAttribute("lang");
        if (ownLang) expect(ownLang).toBe("el");
      }
    }
  });

  it("interactive controls do not carry an aria-label that overrides Greek text in another language", async () => {
    setLocation(
      "https://app.example.com/reset-password#error=access_denied&error_description=Email+link+is+invalid+or+has+expired",
    );
    renderPage();

    const alert = await screen.findByRole("alert");

    const requestBtn = within(alert).getByRole("button", {
      name: "Αίτηση νέου συνδέσμου",
    });
    const backLink = screen.getByRole("link", { name: "Επιστροφή στη σύνδεση" });

    for (const el of [requestBtn, backLink]) {
      // Accessible name must equal the visible Greek text — i.e. no
      // English aria-label silently replacing what the user sees.
      const ariaLabel = el.getAttribute("aria-label");
      if (ariaLabel !== null) {
        expect(GREEK_STRINGS).toContain(ariaLabel);
      }
      // No aria-labelledby pointing at a non-Greek hidden node.
      expect(el.getAttribute("aria-labelledby")).toBeNull();
      // Effective language stays Greek.
      expect(effectiveLang(el)).toBe("el");
    }
  });

  it("verifying-state spinner copy is announced as Greek (not aria-hidden, lang='el')", async () => {
    setLocation("https://app.example.com/reset-password");
    renderPage();

    const verifying = screen.getByText(/Επαλήθευση συνδέσμου/);
    expect(isHiddenFromAssistiveTech(verifying)).toBe(false);
    expect(effectiveLang(verifying)).toBe("el");

    // After timeout, the fallback Greek error must also resolve to lang='el'.
    await waitFor(
      () => expect(screen.getByRole("alert")).toBeInTheDocument(),
      { timeout: 6000 },
    );
    const fallback = screen.getByText(
      "Ο σύνδεσμος ανάκτησης δεν είναι έγκυρος ή έχει λήξει.",
    );
    expect(effectiveLang(fallback)).toBe("el");
    expect(isHiddenFromAssistiveTech(fallback)).toBe(false);
  }, 10000);

  it("recovery form: Greek labels are real <label> text in lang='el', not English aria-labels", async () => {
    setLocation("https://app.example.com/reset-password");
    let captured: ((event: string, session: unknown) => void) | null = null;
    onAuthStateChangeMock.mockImplementation((cb) => {
      captured = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    renderPage();
    captured!("PASSWORD_RECOVERY", { user: { email: "recovered@example.com" } });

    const newPwd = await screen.findByLabelText("Νέος κωδικός");
    const confirm = screen.getByLabelText("Επιβεβαίωση κωδικού");

    for (const input of [newPwd, confirm]) {
      // No conflicting aria-label in a different language.
      const ariaLabel = input.getAttribute("aria-label");
      if (ariaLabel !== null) {
        expect(["Νέος κωδικός", "Επιβεβαίωση κωδικού"]).toContain(ariaLabel);
      }
      expect(effectiveLang(input)).toBe("el");
    }

    // Submit button text is Greek and reachable in Greek language context.
    const submit = screen.getByRole("button", { name: "Αποθήκευση κωδικού" });
    expect(effectiveLang(submit)).toBe("el");
    expect(isHiddenFromAssistiveTech(submit)).toBe(false);
  });
});
