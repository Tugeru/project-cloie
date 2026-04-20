import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertSubmissionIsAllowed,
  buildSubmittedResponsePatch,
  submitStudentCourseBoundResponse,
} from "@/modules/student-evaluation-workflow/services/submit-student-course-bound-response";

const {
  createMock,
  findAssignmentMock,
  findResponseMock,
  resolveAuthSessionMock,
  updateMock,
} = vi.hoisted(() => ({
  createMock: vi.fn(),
  findAssignmentMock: vi.fn(),
  findResponseMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    evaluationAssignment: {
      findFirst: findAssignmentMock,
    },
    qualitativeResponseItem: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    quantitativeResponseItem: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    response: {
      create: createMock,
      findFirst: findResponseMock,
      update: updateMock,
    },
  },
}));

vi.mock("@/modules/identity-access/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

const structureSnapshot = [
  {
    items: [
      {
        key: "remarks",
        kind: "qualitative",
        prompt: "Share your remarks.",
      },
      {
        key: "q1",
        kind: "quantitative",
        prompt: "Rate the instructor.",
        scale: [1, 2, 3, 4, 5],
      },
    ],
    key: "section-a",
    qualitative_prompts: [
      {
        key: "remarks",
        prompt: "Share your remarks.",
      },
    ],
    quantitative_items: [
      {
        key: "q1",
        prompt: "Rate the instructor.",
      },
    ],
    title: "Section A",
  },
] as const;

describe("assertSubmissionIsAllowed", () => {
  it("rejects when required answers are missing", () => {
    expect(() =>
      assertSubmissionIsAllowed({
        answers: {
          "section-a:quantitative:q1": 4,
        },
        structureSnapshot,
      }),
    ).toThrowError("Missing required answers: section-a:qualitative:remarks");
  });
});

describe("buildSubmittedResponsePatch", () => {
  it("creates a submitted patch with workflow field names for later persistence translation", () => {
    expect(
      buildSubmittedResponsePatch({
        submittedAt: "2026-04-20T12:00:00.000Z",
      }),
    ).toEqual({
      status: "SUBMITTED",
      submittedAt: "2026-04-20T12:00:00.000Z",
    });
  });
});

describe("submitStudentCourseBoundResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits a course-bound response and returns its id", async () => {
    resolveAuthSessionMock.mockResolvedValue({ userId: "user-1" });
    findAssignmentMock.mockResolvedValue({
      course_bound_id: "course-bound-1",
      id: "assignment-1",
      course_bound: {
        instrument: {
          structure_snapshot: structureSnapshot,
        },
      },
    });
    findResponseMock.mockResolvedValue({ id: "response-1" });
    updateMock.mockResolvedValue({ id: "response-1" });

    await expect(
      submitStudentCourseBoundResponse({
        answers: {
          "section-a:qualitative:remarks": "Clear and helpful explanations.",
          "section-a:quantitative:q1": 5,
        },
        assignmentId: "assignment-1",
      }),
    ).resolves.toEqual({
      responseId: "response-1",
      status: "SUBMITTED",
      success: true,
    });
  });

  it("rejects a second submission when a submitted response already exists", async () => {
    resolveAuthSessionMock.mockResolvedValue({ userId: "user-1" });
    findAssignmentMock.mockResolvedValue({
      course_bound_id: "course-bound-1",
      id: "assignment-1",
      course_bound: {
        instrument: {
          structure_snapshot: structureSnapshot,
        },
      },
    });
    findResponseMock.mockResolvedValue({ id: "response-1", status: "SUBMITTED" });

    await expect(
      submitStudentCourseBoundResponse({
        answers: {
          "section-a:qualitative:remarks": "Clear and helpful explanations.",
          "section-a:quantitative:q1": 5,
        },
        assignmentId: "assignment-1",
      }),
    ).resolves.toEqual({
      error: "This evaluation has already been submitted.",
      success: false,
    });
  });
});
