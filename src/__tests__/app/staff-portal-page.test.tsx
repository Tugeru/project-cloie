import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import StaffPortalPage from "@/app/(public)/portal/staff/page";
import type { RoleCardConfig } from "@/features/portals/lib/role-card-config";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";

const { resolveAuthSessionMock } = vi.hoisted(() => ({
  resolveAuthSessionMock: vi.fn(),
}));

vi.mock("@/features/auth/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

interface MockPortalShellProps {
  title: string;
  subtitle: string;
  cards: RoleCardConfig[];
  session?: { email: string; isComplete: boolean } | null;
  backLink?: { label: string; href: string };
}

vi.mock("@/features/portals", () => ({
  PortalShell: ({ title, subtitle, cards, session, backLink }: MockPortalShellProps) => (
    <div data-testid="portal-shell">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {session && <p>Signed in as {session.email}</p>}
      <span data-testid="card-count">{cards.length}</span>
      {backLink && <a href={backLink.href}>{backLink.label}</a>}
    </div>
  ),
}));

describe("StaffPortalPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders staff portal with 4 cards when no session is active", async () => {
    resolveAuthSessionMock.mockResolvedValue(null);

    const page = await StaffPortalPage();
    render(page);

    expect(screen.getByText("ACD Staff & Faculty Portal")).toBeInTheDocument();
    expect(screen.getByTestId("card-count").textContent).toBe("4");
    expect(screen.getByText(/Back to portal selection/)).toBeInTheDocument();
  });

  it("renders with session info when user is already signed in", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      userId: "user-123",
      email: "staff@acd.edu.ph",
      roles: [{ role: "FACULTY" }],
      profileGate: { status: "COMPLETE" },
    });

    const page = await StaffPortalPage();
    render(page);

    expect(screen.getByText("ACD Staff & Faculty Portal")).toBeInTheDocument();
    expect(screen.getByTestId("card-count").textContent).toBe("4");
    expect(screen.getByText(/Signed in as staff@acd.edu.ph/)).toBeInTheDocument();
  });
});
