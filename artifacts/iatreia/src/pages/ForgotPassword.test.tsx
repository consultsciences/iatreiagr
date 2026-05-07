import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const createMock = vi.fn();
vi.mock("@clerk/clerk-react", () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: { create: createMock },
  }),
}));

import ForgotPassword from "./ForgotPassword";

const renderPage = () =>
  render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>,
  );

describe("ForgotPassword", () => {
  it("renders the email input and submit button", () => {
    renderPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /αποστολή/i })).toBeInTheDocument();
  });

  it("calls signIn.create with reset_password_email_code strategy on submit", async () => {
    createMock.mockResolvedValueOnce({});
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "doctor@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /αποστολή/i }));
    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith({
        strategy: "reset_password_email_code",
        identifier: "doctor@example.com",
      }),
    );
  });

  it("shows a sent confirmation after successful submit", async () => {
    createMock.mockResolvedValueOnce({});
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /αποστολή/i }));
    await waitFor(() =>
      expect(screen.getByText(/στείλαμε κωδικό/i)).toBeInTheDocument(),
    );
  });

  it("shows an error message when signIn.create rejects", async () => {
    createMock.mockRejectedValueOnce({
      errors: [{ longMessage: "Σφάλμα δοκιμής" }],
    });
    renderPage();
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "bad@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /αποστολή/i }));
    await waitFor(() =>
      expect(screen.getByText("Σφάλμα δοκιμής")).toBeInTheDocument(),
    );
  });
});
