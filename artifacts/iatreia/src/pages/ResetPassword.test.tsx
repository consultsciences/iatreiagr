import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

const attemptFirstFactorMock = vi.fn();
const setActiveMock = vi.fn();
vi.mock("@clerk/clerk-react", () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: { attemptFirstFactor: attemptFirstFactorMock },
    setActive: setActiveMock,
  }),
}));

import ResetPassword from "./ResetPassword";

const renderPage = () =>
  render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>,
  );

describe("ResetPassword", () => {
  it("renders code and password inputs", () => {
    renderPage();
    expect(screen.getByLabelText(/κωδικός επαλήθευσης/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/νέος κωδικός πρόσβασης/i)).toBeInTheDocument();
  });

  it("calls attemptFirstFactor with reset_password_email_code strategy on submit", async () => {
    attemptFirstFactorMock.mockResolvedValueOnce({ status: "complete", createdSessionId: "sess_1" });
    setActiveMock.mockResolvedValueOnce(undefined);
    renderPage();
    fireEvent.change(screen.getByLabelText(/κωδικός επαλήθευσης/i), { target: { value: "123456" } });
    fireEvent.change(screen.getByLabelText(/νέος κωδικός πρόσβασης/i), { target: { value: "newpassword" } });
    fireEvent.click(screen.getByRole("button", { name: /ορισμός/i }));
    await waitFor(() =>
      expect(attemptFirstFactorMock).toHaveBeenCalledWith({
        strategy: "reset_password_email_code",
        code: "123456",
        password: "newpassword",
      }),
    );
  });

  it("navigates to / after successful reset", async () => {
    attemptFirstFactorMock.mockResolvedValueOnce({ status: "complete", createdSessionId: "sess_1" });
    setActiveMock.mockResolvedValueOnce(undefined);
    renderPage();
    fireEvent.change(screen.getByLabelText(/κωδικός επαλήθευσης/i), { target: { value: "123456" } });
    fireEvent.change(screen.getByLabelText(/νέος κωδικός πρόσβασης/i), { target: { value: "newpassword" } });
    fireEvent.click(screen.getByRole("button", { name: /ορισμός/i }));
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/"));
  });

  it("shows an error message when attemptFirstFactor rejects", async () => {
    attemptFirstFactorMock.mockRejectedValueOnce({
      errors: [{ longMessage: "Λάθος κωδικός επαλήθευσης" }],
    });
    renderPage();
    fireEvent.change(screen.getByLabelText(/κωδικός επαλήθευσης/i), { target: { value: "000000" } });
    fireEvent.change(screen.getByLabelText(/νέος κωδικός πρόσβασης/i), { target: { value: "newpassword" } });
    fireEvent.click(screen.getByRole("button", { name: /ορισμός/i }));
    await waitFor(() =>
      expect(screen.getByText("Λάθος κωδικός επαλήθευσης")).toBeInTheDocument(),
    );
  });
});
