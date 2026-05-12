import { beforeEach, describe, expect, it, vi } from "vitest";
import { publishCourseBoundEvaluation } from "@/features/evaluations/services/publish-course-bound-evaluation";
import { ROLES } from "@/lib/constants/roles";

const {
  assignmentCreateManyMock,
  bindingCreateManyMock,
  courseBoundEvaluationCreateMock,
  courseAssignmentFindUniqueMock,
  getFacultyTemplatePublicationContextMock,
  instrumentVersionFindFirstMock,
  listStudentsForClassMock,
  resolveAuthSessionMock,
  targetCreateManyMock,
  transactionMock,
} = vi.hoisted(() => ({
  assignmentCreateManyMock: vi.fn(),
  bindingCreateManyMock: vi.fn(),
  courseBoundEvaluationCreateMock: vi.fn(),
  courseAssignmentFindUniqueMock: vi.fn(),
  getFacultyTemplatePublicationContextMock: vi.fn(),
  instrumentVersionFindFirstMock: vi.fn(),
  listStudentsForClassMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
  targetCreateManyMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
    courseAssignment: {
      findUnique: courseAssignmentFindUniqueMock,
    },
    instrumentVersion: {
      findFirst: instrumentVersionFindFirstMock,
    },
  },
}));

vi.mock("@/features/auth/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

vi.mock("@/features/instruments/services/manage-faculty-templates", () => ({
  getFacultyTemplatePublicationContext: getFacultyTemplatePublicationContextMock,
}));

vi.mock("@/features/enrollments/services/list-students-for-class", () => ({
  listStudentsForClass: listStudentsForClassMock,
}));

const MOCK_ASSIGNMENT = {
  id: "assignment-1",
  course_id: "course-1",
  faculty_id: "faculty-1",
  is_active: true,
  major_id: null,
  program_id: "program-1",
  section: null,
  term_instance_id: "term-instance-1",
  year_level: "FOURTH_YEAR",
  course: {
    code: "IT-401",
    id: "course-1",
    major_id: null,
    major: null,
    title: "Capstone 1",
  },
  program: { code: "BSIT", id: "program-1", name: "BS Information Technology" },
  term_instance: {
    id: "term-instance-1",
    semester: "FIRST",
    term: null,
    school_year: { code: "2025-2026" },
  },
};

const MOCK_PUBLICATION_CONTEXT = {
  success: true as const,
  data: {
    bindings: [
      {
        ciloDescriptionSnapshot: "Apply capstone planning fundamentals.",
        ciloId: "cilo-1",
        itemKey: "q1",
        questionPromptSnapshot: "I achieved outcome one.",
        sectionKey: "outcomes",
      },
      {
        ciloDescriptionSnapshot: "Produce a proposal-aligned outline defense artifact.",
        ciloId: "cilo-2",
        itemKey: "q2",
        questionPromptSnapshot: "I achieved outcome two.",
        sectionKey: "outcomes",
      },
    ],
    cilos: [
      { description: "Apply capstone planning fundamentals.", id: "cilo-1" },
      { description: "Produce a proposal-aligned outline defense artifact.", id: "cilo-2" },
    ],
    course: {
      code: "IT-401",
      courseType: "PROGRAM_SPECIFIC",
      id: "course-1",
      majorId: null,
      majorName: null,
      programCode: "BSIT",
      programId: "program-1",
      programName: "Bachelor of Science in Information Technology",
      scopeLabel: "BSIT - Shared Program Course",
      title: "Capstone 1",
    },
    majorId: null,
    programId: "program-1",
    template: { id: "template-1", name: "Course-Bound CILO Evaluation", structure: [] },
  },
};

describe("publishCourseBoundEvaluation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    transactionMock.mockImplementation(async (callback) =>
      callback({
        courseBoundEvaluation: { create: courseBoundEvaluationCreateMock },
        courseBoundCiloQuestionBinding: { createMany: bindingCreateManyMock },
        courseBoundEvaluationTarget: { createMany: targetCreateManyMock },
        evaluationAssignment: { createMany: assignmentCreateManyMock },
      })
    );
  });

  it("rejects publication when no faculty user is signed in", async () => {
    resolveAuthSessionMock.mockResolvedValue(null);

    await expect(
      publishCourseBoundEvaluation({
        assignmentId: "assignment-1",
        deploymentName: "Capstone CILO Evaluation",
        templateId: "template-1",
      })
    ).resolves.toEqual({
      error: "Faculty authentication is required.",
      success: false,
    });
  });

  it("publishes a course-bound evaluation from the saved faculty template context", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });
    courseAssignmentFindUniqueMock.mockResolvedValue(MOCK_ASSIGNMENT);
    getFacultyTemplatePublicationContextMock.mockResolvedValue(MOCK_PUBLICATION_CONTEXT);
    instrumentVersionFindFirstMock.mockResolvedValue({ id: "version-1" });
    courseBoundEvaluationCreateMock.mockResolvedValue({ id: "evaluation-1" });
    listStudentsForClassMock.mockResolvedValue({
      success: true,
      data: [{ userId: "student-1" }, { userId: "student-2" }],
    });

    await expect(
      publishCourseBoundEvaluation({
        assignmentId: "assignment-1",
        activationAt: null,
        deadlineAt: new Date("2026-05-30T00:00:00.000Z"),
        deploymentName: "Capstone CILO Evaluation",
        templateId: "template-1",
      })
    ).resolves.toEqual({
      assignmentCount: 2,
      evaluationId: "evaluation-1",
      status: "ACTIVE",
      success: true,
      targetCount: 1,
    });

    expect(courseAssignmentFindUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "assignment-1" } })
    );
    expect(getFacultyTemplatePublicationContextMock).toHaveBeenCalledWith("template-1");
    expect(courseBoundEvaluationCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        term_instance_id: "term-instance-1",
        course_id: "course-1",
        deployment_name: "Capstone CILO Evaluation",
        faculty_id: "faculty-1",
        instrument_version_id: "version-1",
        major_id: null,
        program_id: "program-1",
      }),
    });
    expect(bindingCreateManyMock).toHaveBeenCalledWith({
      data: [
        {
          cilo_description_snapshot: "Apply capstone planning fundamentals.",
          cilo_id: "cilo-1",
          course_bound_evaluation_id: "evaluation-1",
          item_key: "q1",
          question_prompt_snapshot: "I achieved outcome one.",
          section_key: "outcomes",
        },
        {
          cilo_description_snapshot: "Produce a proposal-aligned outline defense artifact.",
          cilo_id: "cilo-2",
          course_bound_evaluation_id: "evaluation-1",
          item_key: "q2",
          question_prompt_snapshot: "I achieved outcome two.",
          section_key: "outcomes",
        },
      ],
    });
    expect(listStudentsForClassMock).toHaveBeenCalledWith({
      termInstanceId: "term-instance-1",
      programId: "program-1",
      yearLevel: "FOURTH_YEAR",
      section: null,
    });
    expect(assignmentCreateManyMock).toHaveBeenCalledWith({
      data: [
        { course_bound_id: "evaluation-1", respondent_id: "student-1" },
        { course_bound_id: "evaluation-1", respondent_id: "student-2" },
      ],
    });
  });

  it("surfaces saved template validation failures", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });
    courseAssignmentFindUniqueMock.mockResolvedValue(MOCK_ASSIGNMENT);
    getFacultyTemplatePublicationContextMock.mockResolvedValue({
      error: "Every saved CILO must be assigned to one Likert question before publishing.",
      success: false,
    });

    await expect(
      publishCourseBoundEvaluation({
        assignmentId: "assignment-1",
        deploymentName: "Capstone CILO Evaluation",
        templateId: "template-1",
      })
    ).resolves.toEqual({
      error: "Every saved CILO must be assigned to one Likert question before publishing.",
      success: false,
    });
  });

  it("maps duplicate course-context publishes to a user-facing error", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });
    courseAssignmentFindUniqueMock.mockResolvedValue(MOCK_ASSIGNMENT);
    getFacultyTemplatePublicationContextMock.mockResolvedValue(MOCK_PUBLICATION_CONTEXT);
    instrumentVersionFindFirstMock.mockResolvedValue({ id: "version-1" });
    transactionMock.mockRejectedValue({
      code: "P2002",
      meta: {
        target: ["term_instance_id", "course_id", "faculty_id", "section"],
      },
    });

    await expect(
      publishCourseBoundEvaluation({
        assignmentId: "assignment-1",
        deploymentName: "Capstone CILO Evaluation",
        templateId: "template-1",
      })
    ).resolves.toEqual({
      error: expect.stringContaining("already published"),
      success: false,
    });
  });
});
