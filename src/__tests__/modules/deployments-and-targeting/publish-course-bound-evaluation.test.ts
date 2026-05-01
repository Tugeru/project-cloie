import { beforeEach, describe, expect, it, vi } from "vitest";
import { AcademicSemester, AcademicTerm } from "@prisma/client";
import { publishCourseBoundEvaluation } from "@/features/evaluations/services/publish-course-bound-evaluation";
import { ROLES } from "@/lib/constants/roles";

const {
  assignmentCreateManyMock,
  bindingCreateManyMock,
  courseBoundEvaluationCreateMock,
  getFacultyTemplatePublicationContextMock,
  instrumentVersionFindFirstMock,
  resolveAuthSessionMock,
  studentAcademicProfileFindManyMock,
  targetCreateManyMock,
  transactionMock,
  yearLevelFindManyMock,
} = vi.hoisted(() => ({
  assignmentCreateManyMock: vi.fn(),
  bindingCreateManyMock: vi.fn(),
  courseBoundEvaluationCreateMock: vi.fn(),
  getFacultyTemplatePublicationContextMock: vi.fn(),
  instrumentVersionFindFirstMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
  studentAcademicProfileFindManyMock: vi.fn(),
  targetCreateManyMock: vi.fn(),
  transactionMock: vi.fn(),
  yearLevelFindManyMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
    instrumentVersion: {
      findFirst: instrumentVersionFindFirstMock,
    },
    yearLevel: {
      findMany: yearLevelFindManyMock,
    },
  },
}));

vi.mock("@/features/auth/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

vi.mock("@/features/instruments/services/manage-faculty-templates", () => ({
  getFacultyTemplatePublicationContext: getFacultyTemplatePublicationContextMock,
}));

describe("publishCourseBoundEvaluation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    yearLevelFindManyMock.mockImplementation(async ({ where }) =>
      where.id.in.map((id: string) => ({ id }))
    );

    transactionMock.mockImplementation(async (callback) =>
      callback({
        courseBoundEvaluation: {
          create: courseBoundEvaluationCreateMock,
        },
        courseBoundCiloQuestionBinding: {
          createMany: bindingCreateManyMock,
        },
        courseBoundEvaluationTarget: {
          createMany: targetCreateManyMock,
        },
        evaluationAssignment: {
          createMany: assignmentCreateManyMock,
        },
        studentAcademicProfile: {
          findMany: studentAcademicProfileFindManyMock,
        },
      })
    );
  });

  it("rejects publication when no faculty user is signed in", async () => {
    resolveAuthSessionMock.mockResolvedValue(null);

    await expect(
      publishCourseBoundEvaluation({
        academicYear: "2026-2027",
        deploymentName: "Capstone CILO Evaluation",
        semester: AcademicSemester.FIRST,
        templateId: "template-1",
        term: AcademicTerm.FIRST_TERM,
        yearLevelIds: ["year-4"],
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
    getFacultyTemplatePublicationContextMock.mockResolvedValue({
      success: true,
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
          {
            description: "Apply capstone planning fundamentals.",
            id: "cilo-1",
          },
          {
            description: "Produce a proposal-aligned outline defense artifact.",
            id: "cilo-2",
          },
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
        template: {
          id: "template-1",
          name: "Course-Bound CILO Evaluation",
          structure: [],
        },
      },
    });
    instrumentVersionFindFirstMock.mockResolvedValue({
      id: "version-1",
    });
    courseBoundEvaluationCreateMock.mockResolvedValue({ id: "evaluation-1" });
    studentAcademicProfileFindManyMock.mockResolvedValue([
      { user_id: "student-1" },
      { user_id: "student-2" },
      { user_id: "student-2" },
    ]);

    await expect(
      publishCourseBoundEvaluation({
        academicYear: "2026-2027",
        activationAt: null,
        deadlineAt: new Date("2026-05-30T00:00:00.000Z"),
        deploymentName: "Capstone CILO Evaluation",
        semester: AcademicSemester.FIRST,
        templateId: "template-1",
        term: AcademicTerm.FIRST_TERM,
        yearLevelIds: ["year-4", "year-4", "year-3"],
      })
    ).resolves.toEqual({
      assignmentCount: 2,
      evaluationId: "evaluation-1",
      status: "ACTIVE",
      success: true,
      targetCount: 2,
    });

    expect(getFacultyTemplatePublicationContextMock).toHaveBeenCalledWith("template-1");
    expect(instrumentVersionFindFirstMock).toHaveBeenCalledWith({
      where: {
        is_active: true,
        template_id: "template-1",
        template: {
          faculty_owner_id: "faculty-1",
          id: "template-1",
          is_active: true,
          template_type: "COURSE_BOUND",
        },
      },
      orderBy: {
        version_number: "desc",
      },
      select: {
        id: true,
      },
    });
    expect(courseBoundEvaluationCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        academic_year: "2026-2027",
        course_id: "course-1",
        deployment_name: "Capstone CILO Evaluation",
        faculty_id: "faculty-1",
        instrument_version_id: "version-1",
        major_id: null,
        program_id: "program-1",
        semester: AcademicSemester.FIRST,
        term: AcademicTerm.FIRST_TERM,
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
    expect(studentAcademicProfileFindManyMock).toHaveBeenCalledWith({
      where: {
        academic_year: "2026-2027",
        program_id: {
          in: ["program-1"],
        },
        year_level_id: {
          in: ["year-4", "year-3"],
        },
      },
      select: {
        user_id: true,
      },
    });
    expect(assignmentCreateManyMock).toHaveBeenCalledWith({
      data: [
        {
          course_bound_id: "evaluation-1",
          respondent_id: "student-1",
        },
        {
          course_bound_id: "evaluation-1",
          respondent_id: "student-2",
        },
      ],
    });
  });

  it("surfaces saved template validation failures", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });
    getFacultyTemplatePublicationContextMock.mockResolvedValue({
      error: "Every saved CILO must be assigned to one Likert question before publishing.",
      success: false,
    });

    await expect(
      publishCourseBoundEvaluation({
        academicYear: "2026-2027",
        deploymentName: "Capstone CILO Evaluation",
        semester: AcademicSemester.FIRST,
        templateId: "template-1",
        term: AcademicTerm.FIRST_TERM,
        yearLevelIds: ["year-4"],
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
    getFacultyTemplatePublicationContextMock.mockResolvedValue({
      success: true,
      data: {
        bindings: [
          {
            ciloDescriptionSnapshot: "Apply capstone planning fundamentals.",
            ciloId: "cilo-1",
            itemKey: "q1",
            questionPromptSnapshot: "I achieved outcome one.",
            sectionKey: "outcomes",
          },
        ],
        cilos: [
          {
            description: "Apply capstone planning fundamentals.",
            id: "cilo-1",
          },
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
        template: {
          id: "template-1",
          name: "Course-Bound CILO Evaluation",
          structure: [],
        },
      },
    });
    instrumentVersionFindFirstMock.mockResolvedValue({
      id: "version-1",
    });
    transactionMock.mockRejectedValue({
      code: "P2002",
      meta: {
        target: ["course_id", "faculty_id", "academic_year", "semester", "term", "section"],
      },
    });

    await expect(
      publishCourseBoundEvaluation({
        academicYear: "2026-2027",
        deploymentName: "Capstone CILO Evaluation",
        semester: AcademicSemester.FIRST,
        templateId: "template-1",
        term: AcademicTerm.FIRST_TERM,
        yearLevelIds: ["year-4"],
      })
    ).resolves.toEqual({
      error: "An evaluation is already published for this course context.",
      success: false,
    });
  });
});
