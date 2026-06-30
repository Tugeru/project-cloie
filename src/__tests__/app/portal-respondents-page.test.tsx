import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import RespondentPortalPage from "@/app/(public)/portal/respondents/page";
import type { RoleCardConfig } from "@/features/portals/lib/role-card-config";

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
  crossLink?: { label: string; href: string };
}

vi.mock("@/features/portals", () => ({
  PortalShell: ({ title, subtitle, cards, session, backLink, crossLink }: MockPortalShellProps) => (
    <div data-testid="portal-shell">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {session && <p>Signed in as {session.email}</p>}
      <span data-testid="card-count">{cards.length}</span>
      {backLink && <a href={backLink.href}>{backLink.label}</a>}
      {crossLink && <a href={crossLink.href}>{crossLink.label}</a>}
    </div>
  ),
}));

describe("RespondentPortalPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders respondent portal with 3 cards when no session is active", async () => {
    resolveAuthSessionMock.mockResolvedValue(null);

    const page = await RespondentPortalPage();
    render(page);

    expect(screen.getByText("Welcome to System CLOIE")).toBeInTheDocument();
    expect(screen.getByTestId("card-count").textContent).toBe("3");
    expect(screen.getByText(/Go to Staff Portal/)).toBeInTheDocument();
    expect(screen.getByText(/Back to portal selection/)).toBeInTheDocument();
  });

  it("renders with session info when user is already signed in", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      userId: "user-123",
      email: "user@example.com",
      roles: [],
      profileGate: { status: "COMPLETE" },
    });

    const page = await RespondentPortalPage();
    render(page);

    expect(screen.getByText("Welcome to System CLOIE")).toBeInTheDocument();
    expect(screen.getByTestId("card-count").textContent).toBe("3");
    expect(screen.getByText(/Signed in as user@example.com/)).toBeInTheDocument();
  });
});
