import { beforeEach, describe, expect, it, vi } from "vitest";

const { findManyMock, resolveAuthSessionMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    evaluationAssignment: {
      findMany: findManyMock,
    },
  },
}));

vi.mock("@/features/auth/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

// ─── Fixtures ───────────────────────────────────────────────────────────────

function makeAssignment(overrides: {
  id: string;
  deploymentId: string;
  templateName: string;
  targetStakeholder: string;
  status: string;
  programCode?: string | null;
  majorName?: string | null;
  yearLevelName?: string | null;
  deadlineAt?: Date | null;
  response?: {
    id: string;
    status: string;
    submitted_at: Date | null;
    qual_items?: unknown[];
    quant_items?: unknown[];
  } | null;
}) {
  return {
    id: overrides.id,
    central_deployment_id: overrides.deploymentId,
    central_deployment: {
      id: overrides.deploymentId,
      target_stakeholder: overrides.targetStakeholder,
      status: overrides.status,
      deadline_at: overrides.deadlineAt ?? null,
      instrument: {
        structure_snapshot: undefined,
        template: {
          name: overrides.templateName,
        },
      },
      major: overrides.majorName ? { name: overrides.majorName } : null,
      program: overrides.programCode
        ? { code: overrides.programCode, name: overrides.programCode }
        : null,
      year_level: overrides.yearLevelName ?? null,
    },
    response: overrides.response
      ? {
          ...overrides.response,
          qual_items: overrides.response.qual_items ?? [],
          quant_items: overrides.response.quant_items ?? [],
        }
      : null,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("listStakeholderEvaluations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty lists for unauthenticated users", async () => {
    resolveAuthSessionMock.mockResolvedValue(null);

    const { listStakeholderEvaluations } =
      await import("@/features/responses/services/list-stakeholder-evaluations");

    const result = await listStakeholderEvaluations("ALUMNI");

    expect(result).toEqual({ active: [], submitted: [] });
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("returns only respondent's assigned evaluations", async () => {
    resolveAuthSessionMock.mockResolvedValue({ userId: "user-alumni-1" });
    findManyMock.mockResolvedValue([
      makeAssignment({
        id: "assign-1",
        deploymentId: "deploy-1",
        templateName: "Alumni Feedback Survey",
        targetStakeholder: "ALUMNI",
        status: "ACTIVE",
        programCode: "BSIT",
        deadlineAt: new Date("2026-06-01T00:00:00.000Z"),
      }),
    ]);

    const { listStakeholderEvaluations } =
      await import("@/features/responses/services/list-stakeholder-evaluations");

    const result = await listStakeholderEvaluations("ALUMNI");

    expect(result.active).toHaveLength(1);
    expect(result.active[0]).toMatchObject({
      evaluationId: "deploy-1",
      assignmentId: "assign-1",
      evaluationTitle: "Alumni Feedback Survey",
      status: "NOT_STARTED",
    });
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          respondent_id: "user-alumni-1",
        }),
      })
    );
  });

  it("separates active vs submitted correctly", async () => {
    resolveAuthSessionMock.mockResolvedValue({ userId: "user-1" });
    findManyMock.mockResolvedValue([
      makeAssignment({
        id: "assign-active",
        deploymentId: "deploy-active",
        templateName: "Active Survey",
        targetStakeholder: "ALUMNI",
        status: "ACTIVE",
        programCode: "BSIT",
        deadlineAt: new Date("2026-06-01T00:00:00.000Z"),
      }),
      makeAssignment({
        id: "assign-in-progress",
        deploymentId: "deploy-ip",
        templateName: "In Progress Survey",
        targetStakeholder: "ALUMNI",
        status: "ACTIVE",
        programCode: "BSCS",
        deadlineAt: new Date("2026-06-15T00:00:00.000Z"),
        response: {
          id: "response-ip",
          status: "IN_PROGRESS",
          submitted_at: null,
        },
      }),
      makeAssignment({
        id: "assign-submitted",
        deploymentId: "deploy-submitted",
        templateName: "Submitted Survey",
        targetStakeholder: "ALUMNI",
        status: "ACTIVE",
        programCode: "BSIT",
        deadlineAt: new Date("2026-05-01T00:00:00.000Z"),
        response: {
          id: "response-submitted",
          status: "SUBMITTED",
          submitted_at: new Date("2026-04-20T00:00:00.000Z"),
        },
      }),
    ]);

    const { listStakeholderEvaluations } =
      await import("@/features/responses/services/list-stakeholder-evaluations");

    const result = await listStakeholderEvaluations("ALUMNI");

    expect(result.active).toHaveLength(2);
    expect(result.active[0].status).toBe("NOT_STARTED");
    expect(result.active[1].status).toBe("IN_PROGRESS");

    expect(result.submitted).toHaveLength(1);
    expect(result.submitted[0].status).toBe("SUBMITTED");
    expect(result.submitted[0].session.responseId).toBe("response-submitted");
  });

  it("filters by stakeholder type (ALUMNI vs INDUSTRY_PARTNER)", async () => {
    resolveAuthSessionMock.mockResolvedValue({ userId: "user-ip-1" });
    findManyMock.mockResolvedValue([
      makeAssignment({
        id: "assign-ip-1",
        deploymentId: "deploy-ip-1",
        templateName: "Industry Partner Survey",
        targetStakeholder: "INDUSTRY_PARTNER",
        status: "ACTIVE",
        programCode: "BSIT",
      }),
    ]);

    const { listStakeholderEvaluations } =
      await import("@/features/responses/services/list-stakeholder-evaluations");

    await listStakeholderEvaluations("INDUSTRY_PARTNER");

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          central_deployment: expect.objectContaining({
            target_stakeholder: "INDUSTRY_PARTNER",
          }),
        }),
      })
    );
  });

  it("handles respondent with no assignments", async () => {
    resolveAuthSessionMock.mockResolvedValue({ userId: "user-no-assigns" });
    findManyMock.mockResolvedValue([]);

    const { listStakeholderEvaluations } =
      await import("@/features/responses/services/list-stakeholder-evaluations");

    const result = await listStakeholderEvaluations("ALUMNI");

    expect(result).toEqual({ active: [], submitted: [] });
  });

  it("builds program label from program code, major, and year level", async () => {
    resolveAuthSessionMock.mockResolvedValue({ userId: "user-1" });
    findManyMock.mockResolvedValue([
      makeAssignment({
        id: "assign-1",
        deploymentId: "deploy-1",
        templateName: "Survey",
        targetStakeholder: "ALUMNI",
        status: "ACTIVE",
        programCode: "BSIT",
        majorName: "Web Development",
        yearLevelName: "FOURTH_YEAR",
      }),
    ]);

    const { listStakeholderEvaluations } =
      await import("@/features/responses/services/list-stakeholder-evaluations");

    const result = await listStakeholderEvaluations("ALUMNI");

    expect(result.active[0].programLabel).toBe("BSIT • Web Development • 4th Year");
  });

  it("sorts active items by deadline ascending and submitted by submittedAt descending", async () => {
    resolveAuthSessionMock.mockResolvedValue({ userId: "user-1" });
    findManyMock.mockResolvedValue([
      makeAssignment({
        id: "assign-later",
        deploymentId: "deploy-later",
        templateName: "Later Deadline",
        targetStakeholder: "ALUMNI",
        status: "ACTIVE",
        programCode: "BSIT",
        deadlineAt: new Date("2026-07-01T00:00:00.000Z"),
      }),
      makeAssignment({
        id: "assign-sooner",
        deploymentId: "deploy-sooner",
        templateName: "Sooner Deadline",
        targetStakeholder: "ALUMNI",
        status: "ACTIVE",
        programCode: "BSIT",
        deadlineAt: new Date("2026-06-01T00:00:00.000Z"),
      }),
      makeAssignment({
        id: "assign-sub-old",
        deploymentId: "deploy-sub-old",
        templateName: "Older Submission",
        targetStakeholder: "ALUMNI",
        status: "ACTIVE",
        programCode: "BSIT",
        response: {
          id: "resp-old",
          status: "SUBMITTED",
          submitted_at: new Date("2026-04-01T00:00:00.000Z"),
        },
      }),
      makeAssignment({
        id: "assign-sub-new",
        deploymentId: "deploy-sub-new",
        templateName: "Newer Submission",
        targetStakeholder: "ALUMNI",
        status: "ACTIVE",
        programCode: "BSIT",
        response: {
          id: "resp-new",
          status: "SUBMITTED",
          submitted_at: new Date("2026-04-15T00:00:00.000Z"),
        },
      }),
    ]);

    const { listStakeholderEvaluations } =
      await import("@/features/responses/services/list-stakeholder-evaluations");

    const result = await listStakeholderEvaluations("ALUMNI");

    // Active sorted by deadline asc (sooner first)
    expect(result.active[0].assignmentId).toBe("assign-sooner");
    expect(result.active[1].assignmentId).toBe("assign-later");

    // Submitted sorted by submittedAt desc (newer first)
    expect(result.submitted[0].assignmentId).toBe("assign-sub-new");
    expect(result.submitted[1].assignmentId).toBe("assign-sub-old");
  });
});
