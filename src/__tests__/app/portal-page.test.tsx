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

import type { RoleCardConfig } from "@/features/portals/lib/role-card-config";

interface MockPortalShellProps {
  title: string;
  subtitle: string;
  cards: RoleCardConfig[];
  backLink?: { label: string; href: string };
}

vi.mock("@/features/portals", () => ({
  PortalShell: ({ title, subtitle, cards, backLink }: MockPortalShellProps) => (
    <div data-testid="portal-shell">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <span data-testid="card-count">{cards.length}</span>
      {backLink && <a href={backLink.href}>{backLink.label}</a>}
    </div>
  ),
}));

describe("PortalPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders respondent portal with 3 cards when no session is active", async () => {
    resolveAuthSessionMock.mockResolvedValue(null);

    const page = await PortalPage();
    render(page);

    expect(screen.getByText("Welcome to System CLOIE")).toBeInTheDocument();
    expect(screen.getByTestId("card-count").textContent).toBe("3");
    expect(screen.getByText(/Go to Staff Portal/)).toBeInTheDocument();
  });

  it("renders with session info when user is already signed in", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      userId: "user-123",
      email: "user@example.com",
      roles: [],
      profileGate: { status: "ROLE_SELECTION_REQUIRED" },
    });

    const page = await PortalPage();
    render(page);

    expect(screen.getByText("Welcome to System CLOIE")).toBeInTheDocument();
    expect(screen.getByTestId("card-count").textContent).toBe("3");
  });
});
