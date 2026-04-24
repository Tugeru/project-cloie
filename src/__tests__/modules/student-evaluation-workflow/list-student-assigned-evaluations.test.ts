import { beforeEach, describe, expect, it, vi } from "vitest";
import { listStudentAssignedEvaluations } from "@/features/responses/services/list-student-assigned-evaluations";

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

describe("listStudentAssignedEvaluations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes graduating-student central deployments alongside course-bound work", async () => {
    resolveAuthSessionMock.mockResolvedValue({ userId: "student-1" });
    findManyMock.mockResolvedValue([
      {
        central_deployment: {
          activation_at: new Date("2026-04-01T00:00:00.000Z"),
          deadline_at: new Date("2026-05-20T00:00:00.000Z"),
          instrument: {
            structure_snapshot: [{ key: "section-a", title: "Section A" }],
            template: { name: "Graduating Student Exit Survey" },
          },
          major: { name: "Software Engineering" },
          program: { code: "BSIT", name: "Information Technology" },
          status: "ACTIVE",
          target_stakeholder: "GRADUATING_STUDENT",
          year_level: { name: "4th Year" },
        },
        course_bound: null,
        id: "assignment-central-1",
        response: {
          id: "response-central-1",
          qual_items: [],
          quant_items: [{ id: "quant-1" }],
          submitted_at: null,
        },
      },
    ]);

    const result = await listStudentAssignedEvaluations();

    expect(result).toEqual({
      active: [
        expect.objectContaining({
          assignmentId: "assignment-central-1",
          courseTitle: null,
          deploymentType: "CENTRAL",
          evaluationTitle: "Graduating Student Exit Survey",
          href: "/student/evaluations/assignment-central-1",
          programLabel: "BSIT • Software Engineering • 4th Year",
          status: "IN_PROGRESS",
        }),
      ],
      submitted: [],
    });
  });
});
