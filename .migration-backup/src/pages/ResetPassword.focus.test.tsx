import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

describe("ResetPassword — focus & aria-live for Greek invalid/expired notice", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    onAuthStateChangeMock.mockReset();
    onAuthStateChangeMock.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    getSessionMock.mockReset();
    getSessionMock.mockResolvedValue({ data: { session: null } });
    window.localStorage.clear();
    document.documentElement.setAttribute("lang", "el");
    // Reset focus to body before each test
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  it("invalid-link: focus moves to the Greek alert and aria-live='assertive' is set", async () => {
    setLocation(
      "https://app.example.com/reset-password#error=access_denied&error_description=Email+link+is+invalid+or+has+expired",
    );
    renderPage();

    const alert = await screen.findByRole("alert");

    // The alert is the live region that announces the Greek error.
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveAttribute("aria-atomic", "true");
    expect(alert).toHaveAttribute("lang", "el");

    // It must be programmatically focusable so we can move focus to it
    // without making it a tab stop.
    expect(alert).toHaveAttribute("tabindex", "-1");

    // Focus should have moved to the alert so keyboard + AT users land
    // on the Greek notice immediately.
    await waitFor(() => expect(document.activeElement).toBe(alert));

    // Sanity: the announced text content is in Greek.
    expect(alert.textContent).toMatch(/Μη έγκυρος ή ληγμένος σύνδεσμος/);
    expect(alert.textContent).toMatch(/Email link is invalid or has expired/);
  });

  it("expired-link fallback (4s timeout): focus shifts to the Greek alert when it appears", async () => {
    setLocation("https://app.example.com/reset-password");
    renderPage();

    // Initially the verifying spinner is visible and no alert is focused.
    expect(screen.getByText(/Επαλήθευση συνδέσμου/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // After the 4s fallback the Greek alert appears and receives focus.
    const alert = await screen.findByRole("alert", {}, { timeout: 6000 });
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveAttribute("lang", "el");

    await waitFor(() => expect(document.activeElement).toBe(alert));

    expect(alert.textContent).toMatch(
      /Ο σύνδεσμος ανάκτησης δεν είναι έγκυρος ή έχει λήξει\./,
    );
  }, 10000);

  it("does not steal focus when the link is valid (no error state)", async () => {
    setLocation("https://app.example.com/reset-password");
    let captured: ((event: string, session: unknown) => void) | null = null;
    onAuthStateChangeMock.mockImplementation((cb) => {
      captured = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    renderPage();

    captured!("PASSWORD_RECOVERY", { user: { email: "ok@example.com" } });

    // The success alert ("Ο σύνδεσμος επαληθεύτηκε") must NOT be the
    // focused element — focus should remain on the document body so the
    // user can tab into the password fields naturally.
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/Ο σύνδεσμος επαληθεύτηκε/);
    expect(alert).not.toHaveAttribute("aria-live", "assertive");
    expect(document.activeElement).not.toBe(alert);
  });
});
