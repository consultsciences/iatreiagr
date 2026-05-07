import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
  // jsdom allows reassigning these via defineProperty
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

describe("ResetPassword", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    onAuthStateChangeMock.mockReset();
    onAuthStateChangeMock.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    getSessionMock.mockReset();
    getSessionMock.mockResolvedValue({ data: { session: null } });
    window.localStorage.clear();
  });

  it("shows the link-invalid notice when the URL hash carries an error_description", async () => {
    setLocation(
      "https://app.example.com/reset-password#error=access_denied&error_description=Email+link+is+invalid+or+has+expired",
    );
    renderPage();

    expect(
      await screen.findByText(/Μη έγκυρος ή ληγμένος σύνδεσμος/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Email link is invalid or has expired/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Αίτηση νέου συνδέσμου/i }),
    ).toBeInTheDocument();
  });

  it("falls back to invalid-link notice when no session arrives within 4s", async () => {
    setLocation("https://app.example.com/reset-password");
    renderPage();

    expect(screen.getByText(/Επαλήθευση συνδέσμου/i)).toBeInTheDocument();

    await waitFor(
      () =>
        expect(
          screen.getByText(/Μη έγκυρος ή ληγμένος σύνδεσμος/i),
        ).toBeInTheDocument(),
      { timeout: 6000 },
    );
  }, 10000);

  it("uses the email extracted from the URL hash when requesting a new link", async () => {
    setLocation(
      "https://app.example.com/reset-password#error=otp_expired&error_description=Token+expired&email=doctor%40example.com",
    );
    renderPage();

    const button = await screen.findByRole("button", {
      name: /Αίτηση νέου συνδέσμου/i,
    });
    fireEvent.click(button);

    expect(navigateMock).toHaveBeenCalledWith(
      "/forgot-password?email=doctor%40example.com",
    );
  });

  it("falls back to the last-used email from localStorage when the URL has none", async () => {
    setLocation(
      "https://app.example.com/reset-password#error=otp_expired&error_description=Token+expired",
    );
    window.localStorage.setItem("iatreia:lastAuthEmail", "saved@example.com");
    renderPage();

    const button = await screen.findByRole("button", {
      name: /Αίτηση νέου συνδέσμου/i,
    });
    fireEvent.click(button);

    expect(navigateMock).toHaveBeenCalledWith(
      "/forgot-password?email=saved%40example.com",
    );
  });

  it("E2E: full expired-link flow renders notice, prefilled email and navigates on request", async () => {
    setLocation(
      "https://app.example.com/reset-password#error=access_denied&error_description=Email+link+is+invalid+or+has+expired&email=expired%40example.com",
    );
    // Also seed localStorage with a different email — URL must take precedence
    window.localStorage.setItem("iatreia:lastAuthEmail", "stale@example.com");
    renderPage();

    // 1. Invalid-link notice rendered (from extractErrorFromRecoveryUrl)
    expect(
      await screen.findByText(/Μη έγκυρος ή ληγμένος σύνδεσμος/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Email link is invalid or has expired/i),
    ).toBeInTheDocument();

    // 2. Password form is NOT shown
    expect(screen.queryByLabelText(/Νέος κωδικός/i)).not.toBeInTheDocument();

    // 3. Request-new-link button uses the URL email (not the localStorage one)
    const button = screen.getByRole("button", {
      name: /Αίτηση νέου συνδέσμου/i,
    });
    fireEvent.click(button);
    expect(navigateMock).toHaveBeenCalledWith(
      "/forgot-password?email=expired%40example.com",
    );
    expect(navigateMock).not.toHaveBeenCalledWith(
      "/forgot-password?email=stale%40example.com",
    );
  });

  it("renders the password form when a recovery session is established", async () => {
    setLocation("https://app.example.com/reset-password");
    let captured: ((event: string, session: unknown) => void) | null = null;
    onAuthStateChangeMock.mockImplementation((cb) => {
      captured = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    renderPage();

    captured!("PASSWORD_RECOVERY", { user: { email: "recovered@example.com" } });

    expect(
      await screen.findByText(/Ο σύνδεσμος επαληθεύτηκε/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Νέος κωδικός/i)).toBeInTheDocument();
  });

  describe("Greek UI strings", () => {
    const GREEK = {
      pageTitle: "Ορισμός νέου κωδικού",
      pageSubtitle: "Εισάγετε τον νέο σας κωδικό πρόσβασης.",
      noticeTitle: "Μη έγκυρος ή ληγμένος σύνδεσμος",
      noticeHelp:
        /Οι σύνδεσμοι ανάκτησης ισχύουν για περιορισμένο χρόνο και μπορούν να χρησιμοποιηθούν μόνο μία φορά\.\s*Ζητήστε νέο σύνδεσμο και ανοίξτε τον από το ίδιο πρόγραμμα περιήγησης\./,
      requestButton: "Αίτηση νέου συνδέσμου",
      backLink: "Επιστροφή στη σύνδεση",
      verifying: /Επαλήθευση συνδέσμου/,
      fallbackError: "Ο σύνδεσμος ανάκτησης δεν είναι έγκυρος ή έχει λήξει.",
    } as const;

    it("renders all invalid-link Greek strings when URL has error_description", async () => {
      setLocation(
        "https://app.example.com/reset-password#error=access_denied&error_description=Email+link+is+invalid+or+has+expired",
      );
      renderPage();

      expect(
        screen.getByRole("heading", { name: GREEK.pageTitle }),
      ).toBeInTheDocument();
      expect(screen.getByText(GREEK.pageSubtitle)).toBeInTheDocument();
      expect(screen.getByText(GREEK.backLink)).toBeInTheDocument();

      expect(await screen.findByText(GREEK.noticeTitle)).toBeInTheDocument();
      expect(screen.getByText(GREEK.noticeHelp)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: GREEK.requestButton }),
      ).toBeInTheDocument();
    });

    it("renders the Greek expired-link fallback message after the 4s timeout", async () => {
      setLocation("https://app.example.com/reset-password");
      renderPage();

      expect(screen.getByText(GREEK.verifying)).toBeInTheDocument();

      await waitFor(
        () => expect(screen.getByText(GREEK.noticeTitle)).toBeInTheDocument(),
        { timeout: 6000 },
      );

      expect(screen.getByText(GREEK.fallbackError)).toBeInTheDocument();
      expect(screen.getByText(GREEK.noticeHelp)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: GREEK.requestButton }),
      ).toBeInTheDocument();
    }, 10000);
  });
});
