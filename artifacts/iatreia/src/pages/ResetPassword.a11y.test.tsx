import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe } from "jest-axe";

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

describe("ResetPassword a11y (Greek)", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    onAuthStateChangeMock.mockReset();
    onAuthStateChangeMock.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    getSessionMock.mockReset();
    getSessionMock.mockResolvedValue({ data: { session: null } });
    window.localStorage.clear();
  });

  it("invalid-link notice exposes correct roles, accessible names, and visible Greek text", async () => {
    setLocation(
      "https://app.example.com/reset-password#error=access_denied&error_description=Email+link+is+invalid+or+has+expired",
    );
    const { container } = renderPage();

    // Page heading is a real <h1>-level heading with Greek title
    const heading = await screen.findByRole("heading", {
      name: "Ορισμός νέου κωδικού",
    });
    expect(heading).toBeInTheDocument();

    // Alert has role="alert" (shadcn Alert) and contains the Greek title + body
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(
      within(alert).getByText("Μη έγκυρος ή ληγμένος σύνδεσμος"),
    ).toBeInTheDocument();
    expect(
      within(alert).getByText(/Οι σύνδεσμοι ανάκτησης ισχύουν/),
    ).toBeInTheDocument();

    // Action button has accessible name in Greek and is reachable
    const requestBtn = within(alert).getByRole("button", {
      name: "Αίτηση νέου συνδέσμου",
    });
    expect(requestBtn).toBeEnabled();
    expect(requestBtn).toHaveAccessibleName("Αίτηση νέου συνδέσμου");

    // Back-to-login link is a real link with accessible Greek name + href
    const backLink = screen.getByRole("link", {
      name: "Επιστροφή στη σύνδεση",
    });
    expect(backLink).toHaveAttribute("href", "/doctors/auth");

    // Contrast-safe text presence: the destructive Alert variant uses
    // `text-destructive` (theme token) — ensure body copy is not hidden
    // and not styled with sr-only, so it is actually presented to users.
    const helpText = within(alert).getByText(/Οι σύνδεσμοι ανάκτησης ισχύουν/);
    expect(helpText).toBeVisible();
    expect(helpText.className).not.toMatch(/sr-only/);

    // axe scan — no a11y violations on the rendered tree.
    // `heading-order` is disabled: shadcn's <AlertTitle> renders as <h5>,
    // which is a known best-practice warning from the component library
    // and not something this page controls.
    const results = await axe(container, {
      rules: { "heading-order": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it("expired-link fallback (4s timeout) keeps the same accessible structure", async () => {
    setLocation("https://app.example.com/reset-password");
    const { container } = renderPage();

    // While verifying, the spinner copy is announced as plain Greek text
    expect(screen.getByText(/Επαλήθευση συνδέσμου/)).toBeInTheDocument();

    // After fallback, alert appears with the same roles + Greek labels
    await waitFor(
      () => expect(screen.getByRole("alert")).toBeInTheDocument(),
      { timeout: 6000 },
    );
    const alert = screen.getByRole("alert");
    expect(
      within(alert).getByText("Μη έγκυρος ή ληγμένος σύνδεσμος"),
    ).toBeInTheDocument();
    expect(
      within(alert).getByText(
        "Ο σύνδεσμος ανάκτησης δεν είναι έγκυρος ή έχει λήξει.",
      ),
    ).toBeVisible();
    expect(
      within(alert).getByRole("button", { name: "Αίτηση νέου συνδέσμου" }),
    ).toBeEnabled();

    const results = await axe(container, {
      rules: { "heading-order": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  }, 10000);

  it("recovered form exposes labelled password inputs and submit button in Greek", async () => {
    setLocation("https://app.example.com/reset-password");
    let captured: ((event: string, session: unknown) => void) | null = null;
    onAuthStateChangeMock.mockImplementation((cb) => {
      captured = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    const { container } = renderPage();
    captured!("PASSWORD_RECOVERY", { user: { email: "recovered@example.com" } });

    const newPwd = await screen.findByLabelText("Νέος κωδικός");
    const confirm = screen.getByLabelText("Επιβεβαίωση κωδικού");
    expect(newPwd).toHaveAttribute("type", "password");
    expect(confirm).toHaveAttribute("type", "password");
    expect(newPwd).toHaveAttribute("autoComplete", "new-password");

    expect(
      screen.getByRole("button", { name: "Αποθήκευση κωδικού" }),
    ).toBeEnabled();

    const alert = screen.getByRole("alert");
    expect(
      within(alert).getByText("Ο σύνδεσμος επαληθεύτηκε"),
    ).toBeInTheDocument();

    const results = await axe(container, {
      rules: { "heading-order": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
