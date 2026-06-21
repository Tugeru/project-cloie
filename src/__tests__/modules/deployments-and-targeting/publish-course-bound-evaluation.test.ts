import { beforeEach, describe, expect, it, vi } from "vitest";
import { publishCourseBoundEvaluation } from "@/features/evaluations/services/publish-course-bound-evaluation";
import { ROLES } from "@/lib/constants/roles";
import { createPrismaUniqueConstraintError } from "@/__tests__/helpers/prisma-test-helpers";

const {
  assignmentCreateManyMock,
  bindingCreateManyMock,
  courseBoundEvaluationCreateMock,
  courseAssignmentFindUniqueMock,
  getFacultyTemplatePublicationContextMock,
  instrumentVersionFindFirstMock,
  instrumentTemplateFindFirstMock,
  listStudentsForClassMock,
  programHeadAssignmentFindManyMock,
  ciloFindManyMock,
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
  instrumentTemplateFindFirstMock: vi.fn(),
  listStudentsForClassMock: vi.fn(),
  programHeadAssignmentFindManyMock: vi.fn(),
  ciloFindManyMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
  targetCreateManyMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
    courseAssignment: {
      findUnique: courseAssignmentFindUniqueMock,
      findFirst: courseAssignmentFindUniqueMock,
    },
    instrumentVersion: {
      findFirst: instrumentVersionFindFirstMock,
    },
    instrumentTemplate: {
      findFirst: instrumentTemplateFindFirstMock,
    },
    programHeadAssignment: {
      findMany: programHeadAssignmentFindManyMock,
    },
    cILO: {
      findMany: ciloFindManyMock,
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

const MOCK_BOUND_TEMPLATE = {
  id: "bound-template-1",
  bound_course_id: "course-1",
  bound_course: {
    id: "course-1",
    code: "IT-401",
    title: "Capstone 1",
    course_scope: "PROGRAM_SPECIFIC",
    program_id: "program-1",
  },
  template_cilo_question_bindings: [
    {
      cilo_id: "cilo-1",
      section_key: "outcomes",
      item_key: "q1",
    },
    {
      cilo_id: "cilo-2",
      section_key: "outcomes",
      item_key: "q2",
    },
  ],
  structure: [
    {
      key: "outcomes",
      questions: [
        {
          key: "q1",
          question_type: "LIKERT",
          prompt: "I achieved outcome one.",
        },
        {
          key: "q2",
          question_type: "LIKERT",
          prompt: "I achieved outcome two.",
        },
      ],
    },
  ],
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

    // Default mocks for on-behalf template lookup
    instrumentTemplateFindFirstMock.mockResolvedValue({
      id: "bound-template-1",
      bound_course_id: "course-1",
      bound_course: {
        id: "course-1",
        code: "IT-401",
        title: "Capstone 1",
        course_scope: "PROGRAM_SPECIFIC",
        program_id: "program-1",
      },
      template_cilo_question_bindings: [
        {
          cilo_id: "cilo-1",
          section_key: "outcomes",
          item_key: "q1",
        },
        {
          cilo_id: "cilo-2",
          section_key: "outcomes",
          item_key: "q2",
        },
      ],
      structure: [
        {
          key: "outcomes",
          questions: [
            {
              key: "q1",
              question_type: "LIKERT",
              prompt: "I achieved outcome one.",
            },
            {
              key: "q2",
              question_type: "LIKERT",
              prompt: "I achieved outcome two.",
            },
          ],
        },
      ],
    });

    ciloFindManyMock.mockResolvedValue([
      { description: "Apply capstone planning fundamentals.", id: "cilo-1" },
      { description: "Produce a proposal-aligned outline defense artifact.", id: "cilo-2" },
    ]);

    programHeadAssignmentFindManyMock.mockResolvedValue([{ program_id: "program-1" }]);
  });

  it("rejects publication when no user is signed in", async () => {
    resolveAuthSessionMock.mockResolvedValue(null);

    await expect(
      publishCourseBoundEvaluation({
        assignmentId: "assignment-1",
        deploymentName: "Capstone CILO Evaluation",
        templateId: "template-1",
      })
    ).resolves.toEqual({
      error: "Authentication required.",
      success: false,
    });
  });

  it("publishes a course-bound evaluation from the saved faculty template context", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      activeRole: ROLES.FACULTY,
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
      success: true,
      data: {
        assignmentCount: 2,
        evaluationId: "evaluation-1",
        status: "ACTIVE",
        targetCount: 1,
      },
    });

    expect(courseAssignmentFindUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "assignment-1", is_active: true } })
    );
    expect(getFacultyTemplatePublicationContextMock).toHaveBeenCalledWith("template-1");
    expect(courseBoundEvaluationCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        course_assignment_id: "assignment-1",
        term_instance_id: "term-instance-1",
        deployed_by: "faculty-1",
        deployment_name: "Capstone CILO Evaluation",
        instrument_version_id: "version-1",
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
      activeRole: ROLES.FACULTY,
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
      activeRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });
    courseAssignmentFindUniqueMock.mockResolvedValue(MOCK_ASSIGNMENT);
    getFacultyTemplatePublicationContextMock.mockResolvedValue(MOCK_PUBLICATION_CONTEXT);
    instrumentVersionFindFirstMock.mockResolvedValue({ id: "version-1" });
    transactionMock.mockRejectedValue(createPrismaUniqueConstraintError());

    await expect(
      publishCourseBoundEvaluation({
        assignmentId: "assignment-1",
        deploymentName: "Capstone CILO Evaluation",
        templateId: "template-1",
      })
    ).resolves.toEqual({
      error: expect.stringContaining("already has a deployed evaluation"),
      success: false,
    });
  });

  describe("Issue #43: On-behalf deployment", () => {
    it("stores deployed_by as deployer (not faculty_id) for on-behalf deployment by Program Head", async () => {
      const phUserId = "ph-user-1";
      resolveAuthSessionMock.mockResolvedValue({
        activeRole: ROLES.PROGRAM_HEAD,
        roles: [ROLES.PROGRAM_HEAD],
        userId: phUserId,
      });
      programHeadAssignmentFindManyMock.mockResolvedValue([{ program_id: "program-1" }]);
      courseAssignmentFindUniqueMock.mockResolvedValue(MOCK_ASSIGNMENT);
      instrumentTemplateFindFirstMock.mockResolvedValue(MOCK_BOUND_TEMPLATE);
      getFacultyTemplatePublicationContextMock.mockResolvedValue(MOCK_PUBLICATION_CONTEXT);
      instrumentVersionFindFirstMock.mockResolvedValue({ id: "version-1" });
      courseBoundEvaluationCreateMock.mockResolvedValue({ id: "evaluation-1" });
      listStudentsForClassMock.mockResolvedValue({
        success: true,
        data: [{ userId: "student-1" }],
      });

      await publishCourseBoundEvaluation({
        assignmentId: "assignment-1",
        deploymentName: "PH On-Behalf Evaluation",
        templateId: "template-1",
        deployerId: phUserId,
      });

      expect(courseBoundEvaluationCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          course_assignment_id: "assignment-1",
          deployed_by: phUserId,
          deployment_name: "PH On-Behalf Evaluation",
        }),
      });
    });

    it("rejects on-behalf deployment when course has no bound template", async () => {
      const deanUserId = "dean-user-1";
      resolveAuthSessionMock.mockResolvedValue({
        activeRole: ROLES.DEAN,
        roles: [ROLES.FACULTY, ROLES.DEAN],
        userId: deanUserId,
      });
      courseAssignmentFindUniqueMock.mockResolvedValue(MOCK_ASSIGNMENT);
      instrumentTemplateFindFirstMock.mockResolvedValue(null);

      await expect(
        publishCourseBoundEvaluation({
          assignmentId: "assignment-1",
          deploymentName: "Dean On-Behalf Evaluation",
          templateId: "template-1",
          deployerId: deanUserId,
        })
      ).resolves.toEqual({
        error: "On-behalf deployment requires a course-bound template. Please create one first.",
        success: false,
      });
    });

    it("denies faculty member from deploying another faculty's assignment", async () => {
      const otherFacultyId = "faculty-2";
      resolveAuthSessionMock.mockResolvedValue({
        activeRole: ROLES.FACULTY,
        roles: [ROLES.FACULTY],
        userId: otherFacultyId,
      });
      courseAssignmentFindUniqueMock.mockResolvedValue(MOCK_ASSIGNMENT);

      await expect(
        publishCourseBoundEvaluation({
          assignmentId: "assignment-1",
          deploymentName: "Unauthorized Evaluation",
          templateId: "template-1",
          deployerId: otherFacultyId,
        })
      ).resolves.toEqual({
        error: "Only the assigned faculty member can deploy this evaluation.",
        success: false,
      });
    });

    it("allows Dean to deploy on-behalf for any assignment with bound template", async () => {
      const deanUserId = "dean-user-1";
      resolveAuthSessionMock.mockResolvedValue({
        activeRole: ROLES.DEAN,
        roles: [ROLES.FACULTY, ROLES.DEAN],
        userId: deanUserId,
      });
      courseAssignmentFindUniqueMock.mockResolvedValue(MOCK_ASSIGNMENT);
      instrumentTemplateFindFirstMock.mockResolvedValue(MOCK_BOUND_TEMPLATE);
      getFacultyTemplatePublicationContextMock.mockResolvedValue(MOCK_PUBLICATION_CONTEXT);
      instrumentVersionFindFirstMock.mockResolvedValue({ id: "version-1" });
      courseBoundEvaluationCreateMock.mockResolvedValue({ id: "evaluation-1" });
      listStudentsForClassMock.mockResolvedValue({
        success: true,
        data: [{ userId: "student-1" }],
      });

      const result = await publishCourseBoundEvaluation({
        assignmentId: "assignment-1",
        deploymentName: "Dean On-Behalf Evaluation",
        templateId: "template-1",
        deployerId: deanUserId,
      });

      expect(result.success).toBe(true);
      expect(courseBoundEvaluationCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deployed_by: deanUserId,
        }),
      });
    });

    it("allows Secretary to deploy on-behalf for any assignment with bound template", async () => {
      const secretaryUserId = "secretary-user-1";
      resolveAuthSessionMock.mockResolvedValue({
        activeRole: ROLES.SECRETARY,
        roles: [ROLES.FACULTY, ROLES.SECRETARY],
        userId: secretaryUserId,
      });
      courseAssignmentFindUniqueMock.mockResolvedValue(MOCK_ASSIGNMENT);
      instrumentTemplateFindFirstMock.mockResolvedValue(MOCK_BOUND_TEMPLATE);
      getFacultyTemplatePublicationContextMock.mockResolvedValue(MOCK_PUBLICATION_CONTEXT);
      instrumentVersionFindFirstMock.mockResolvedValue({ id: "version-1" });
      courseBoundEvaluationCreateMock.mockResolvedValue({ id: "evaluation-1" });
      listStudentsForClassMock.mockResolvedValue({
        success: true,
        data: [{ userId: "student-1" }],
      });

      const result = await publishCourseBoundEvaluation({
        assignmentId: "assignment-1",
        deploymentName: "Secretary On-Behalf Evaluation",
        templateId: "template-1",
        deployerId: secretaryUserId,
      });

      expect(result.success).toBe(true);
    });

    it("allows Program Head to deploy on-behalf for assignment in their program scope", async () => {
      const phUserId = "ph-user-1";
      resolveAuthSessionMock.mockResolvedValue({
        activeRole: ROLES.PROGRAM_HEAD,
        roles: [ROLES.PROGRAM_HEAD],
        userId: phUserId,
      });
      programHeadAssignmentFindManyMock.mockResolvedValue([{ program_id: "program-1" }]);
      courseAssignmentFindUniqueMock.mockResolvedValue(MOCK_ASSIGNMENT);
      const result = await publishCourseBoundEvaluation({
        assignmentId: "assignment-1",
        deploymentName: "PH In-Scope Evaluation",
        templateId: "template-1",
        deployerId: phUserId,
      });

      expect(result.success).toBe(true);
    });
  });
});
