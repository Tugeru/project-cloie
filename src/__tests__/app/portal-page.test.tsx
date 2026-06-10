import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import PortalPage from "@/app/(public)/portal/page";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";

const { resolveAuthSessionMock } = vi.hoisted(() => ({
  resolveAuthSessionMock: vi.fn(),
}));

vi.mock("@/features/auth/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

vi.mock("@/features/portals", () => ({
  ROLE_CARDS: [],
  RoleSelectionCard: () => <div data-testid="role-card" />,
}));

describe("PortalPage Sign Out", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders sign out form pointing to /api/auth/logout when user session is active", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      userId: "user-123",
      email: "user@example.com",
      roles: [],
      profileGate: { status: "ROLE_SELECTION_REQUIRED" },
    });

    const page = await PortalPage();
    render(page);

    const signOutButton = screen.getByRole("button", { name: /sign out/i });
    expect(signOutButton).toBeInTheDocument();

    const form = signOutButton.closest("form");
    expect(form).not.toBeNull();
    expect(form!.getAttribute("action")).toBe("/api/auth/logout");
    expect(form!.getAttribute("method")).toBe("post");
  });
});
