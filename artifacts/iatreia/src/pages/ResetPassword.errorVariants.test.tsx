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

const expectGreekAlertWithFocus = async () => {
  const alert = await screen.findByRole("alert", {}, { timeout: 6000 });
  expect(alert).toHaveAttribute("aria-live", "assertive");
  expect(alert).toHaveAttribute("aria-atomic", "true");
  expect(alert).toHaveAttribute("lang", "el");
  expect(alert).toHaveAttribute("tabindex", "-1");
  await waitFor(() => expect(document.activeElement).toBe(alert));
  // The Greek title is always rendered alongside whatever raw error came in.
  expect(alert.textContent).toMatch(/Μη έγκυρος ή ληγμένος σύνδεσμος/);
  return alert;
};

describe("ResetPassword — additional Greek link-error variants", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    onAuthStateChangeMock.mockReset();
    onAuthStateChangeMock.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    getSessionMock.mockReset();
    getSessionMock.mockResolvedValue({ data: { session: null } });
    window.localStorage.clear();
    document.documentElement.setAttribute("lang", "el");
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  it("error code only (no error_description) still triggers focus + assertive announcement", async () => {
    setLocation("https://app.example.com/reset-password#error=access_denied");
    renderPage();

    const alert = await expectGreekAlertWithFocus();
    // Falls back to the `error` code value when description is absent.
    expect(alert.textContent).toMatch(/access_denied/);
  });

  it("unexpected/unknown error code is still surfaced with focus + aria-live", async () => {
    setLocation(
      "https://app.example.com/reset-password#error=some_unknown_code&error_description=Something+weird+happened",
    );
    renderPage();

    const alert = await expectGreekAlertWithFocus();
    expect(alert.textContent).toMatch(/Something weird happened/);
  });

  it("server_error variant (different error code family) activates the Greek notice", async () => {
    setLocation(
      "https://app.example.com/reset-password#error=server_error&error_description=Internal+server+error",
    );
    renderPage();

    const alert = await expectGreekAlertWithFocus();
    expect(alert.textContent).toMatch(/Internal server error/);
  });

  it("empty error_description value still surfaces a Greek a11y-wired notice (via 4s fallback)", async () => {
    setLocation(
      "https://app.example.com/reset-password#error=otp_expired&error_description=",
    );
    renderPage();

    // Empty description AND empty-string error params → helper returns null,
    // so the 4s session-missing fallback kicks in. The alert must still be
    // focused, lang=el and aria-live=assertive.
    const alert = await expectGreekAlertWithFocus();
    expect(alert.textContent).toMatch(
      /Ο σύνδεσμος ανάκτησης δεν είναι έγκυρος ή έχει λήξει\./,
    );
  }, 10000);

  it("malformed hash with stray separators still parses the error and announces it", async () => {
    setLocation(
      "https://app.example.com/reset-password#&&error=access_denied&&error_description=Email+link+is+invalid+or+has+expired&",
    );
    renderPage();

    const alert = await expectGreekAlertWithFocus();
    expect(alert.textContent).toMatch(/Email link is invalid or has expired/);
  });

  it("URL-encoded multibyte error_description is decoded and announced in the alert", async () => {
    // "Σφάλμα" URL-encoded
    setLocation(
      "https://app.example.com/reset-password#error=access_denied&error_description=%CE%A3%CF%86%CE%AC%CE%BB%CE%BC%CE%B1",
    );
    renderPage();

    const alert = await expectGreekAlertWithFocus();
    expect(alert.textContent).toMatch(/Σφάλμα/);
  });

  it("unexpected error code without description does NOT render the success/recovery form", async () => {
    setLocation("https://app.example.com/reset-password#error=mystery_failure");
    renderPage();

    await expectGreekAlertWithFocus();
    expect(screen.queryByLabelText(/Νέος κωδικός/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ο σύνδεσμος επαληθεύτηκε/i)).not.toBeInTheDocument();
  });
});
