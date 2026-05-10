import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("@/lib/listings", () => ({
  fetchFeaturedListings: vi.fn(() => Promise.resolve([])),
  fetchListingCounts: vi.fn(() => Promise.resolve({ total: 0, spaces: 0, equipment: 0, jobs: 0, supplies: 0, services: 0 })),
}));

vi.mock("@clerk/clerk-react", () => ({
  useUser: () => ({ user: null, isLoaded: true }),
  useClerk: () => ({ signOut: vi.fn(), session: null }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignIn: () => null,
  SignUp: () => null,
}));

import Index from "./Index";

function renderPage() {
  return render(
    <MemoryRouter>
      <Index />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Index hero search bar", () => {
  it("renders the search input and city input", () => {
    renderPage();
    expect(
      screen.getByPlaceholderText(/τι ψάχνετε/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByPlaceholderText(/πόλη/i)[0],
    ).toBeInTheDocument();
  });

  it("renders the search submit button", () => {
    renderPage();
    expect(
      screen.getByRole("button", { name: /αναζήτηση αγγελιών/i }),
    ).toBeInTheDocument();
  });

  it("navigates to /search?q=... when a query is typed and the form is submitted", () => {
    renderPage();
    fireEvent.change(screen.getByPlaceholderText(/τι ψάχνετε/i), {
      target: { value: "υπερηχογράφος" },
    });
    fireEvent.click(screen.getByRole("button", { name: /αναζήτηση αγγελιών/i }));
    expect(navigateMock).toHaveBeenCalledOnce();
    const url: string = navigateMock.mock.calls[0][0];
    expect(url).toMatch(/^\/search\?/);
    expect(url).toContain("q=%CF%85%CF%80%CE%B5%CF%81%CE%B7%CF%87%CE%BF%CE%B3%CF%81%CE%AC%CF%86%CE%BF%CF%82");
  });

  it("navigates to /search?q=...&city=... when both query and city are typed", () => {
    renderPage();
    fireEvent.change(screen.getByPlaceholderText(/τι ψάχνετε/i), {
      target: { value: "οδοντιατρείο" },
    });
    fireEvent.change(screen.getAllByPlaceholderText(/πόλη/i)[0], {
      target: { value: "Αθήνα" },
    });
    fireEvent.click(screen.getByRole("button", { name: /αναζήτηση αγγελιών/i }));
    expect(navigateMock).toHaveBeenCalledOnce();
    const url: string = navigateMock.mock.calls[0][0];
    expect(url).toMatch(/^\/search\?/);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("q")).toBe("οδοντιατρείο");
    expect(params.get("city")).toBe("Αθήνα");
  });

  it("navigates to /search without query params when no input is provided", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /αναζήτηση αγγελιών/i }));
    expect(navigateMock).toHaveBeenCalledOnce();
    const url: string = navigateMock.mock.calls[0][0];
    expect(url).toBe("/search?");
  });

  it("navigates to /search with correct params when a popular shortcut is clicked", () => {
    renderPage();
    const shortcut = screen.getByRole("button", { name: /ιατρείο αθήνα/i });
    fireEvent.click(shortcut);
    expect(navigateMock).toHaveBeenCalledOnce();
    const url: string = navigateMock.mock.calls[0][0];
    expect(url).toMatch(/^\/search\?/);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("q")).toBeTruthy();
    expect(params.get("city")).toBe("Αθήνα");
  });
});
