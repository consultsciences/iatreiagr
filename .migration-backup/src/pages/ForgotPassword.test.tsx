import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ForgotPassword from "./ForgotPassword";

// Mock the Supabase client — ForgotPassword imports it at module load, but we don't
// invoke any auth methods just by rendering.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ForgotPassword />
    </MemoryRouter>,
  );

describe("ForgotPassword prefill", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("prefills the email field from the ?email= query parameter", () => {
    renderAt("/forgot-password?email=doctor%40example.com");
    const input = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(input.value).toBe("doctor@example.com");
    expect(
      screen.getByText(/Συμπληρώθηκε αυτόματα από προηγούμενη χρήση/i),
    ).toBeInTheDocument();
  });

  it("falls back to the last-used email in localStorage", () => {
    window.localStorage.setItem("iatreia:lastAuthEmail", "saved@example.com");
    renderAt("/forgot-password");
    const input = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(input.value).toBe("saved@example.com");
  });

  it("ignores invalid query values and leaves the field empty", () => {
    renderAt("/forgot-password?email=not-an-email");
    const input = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(input.value).toBe("");
    expect(
      screen.queryByText(/Συμπληρώθηκε αυτόματα/i),
    ).not.toBeInTheDocument();
  });

  it("renders an empty field when neither query nor storage has a valid email", () => {
    renderAt("/forgot-password");
    const input = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(input.value).toBe("");
  });
});
