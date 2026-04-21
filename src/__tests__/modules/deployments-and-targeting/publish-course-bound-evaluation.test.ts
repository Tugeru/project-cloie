import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROLES } from "@/lib/constants/roles";
import { publishCourseBoundEvaluation } from "@/modules/deployments-and-targeting/services/publish-course-bound-evaluation";

const {
  assignmentCreateManyMock,
  ciloDeleteManyMock,
  ciloUpsertMock,
  courseBoundEvaluationCreateMock,
  courseFindFirstMock,
  instrumentVersionFindFirstMock,
  resolveAuthSessionMock,
  studentAcademicProfileFindManyMock,
  targetCreateManyMock,
  transactionMock,
  yearLevelFindManyMock,
} = vi.hoisted(() => ({
  assignmentCreateManyMock: vi.fn(),
  ciloDeleteManyMock: vi.fn(),
  ciloUpsertMock: vi.fn(),
  courseBoundEvaluationCreateMock: vi.fn(),
  courseFindFirstMock: vi.fn(),
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
    course: {
      findFirst: courseFindFirstMock,
    },
    instrumentVersion: {
      findFirst: instrumentVersionFindFirstMock,
    },
    yearLevel: {
      findMany: yearLevelFindManyMock,
    },
  },
}));

vi.mock("@/modules/identity-access/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

describe("publishCourseBoundEvaluation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    yearLevelFindManyMock.mockImplementation(async ({ where }) =>
      where.id.in.map((id: string) => ({ id })),
    );

    transactionMock.mockImplementation(async (callback) =>
      callback({
        cILO: {
          deleteMany: ciloDeleteManyMock,
          upsert: ciloUpsertMock,
        },
        courseBoundEvaluation: {
          create: courseBoundEvaluationCreateMock,
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
      }),
    );
  });

  it("rejects publication when no faculty user is signed in", async () => {
    resolveAuthSessionMock.mockResolvedValue(null);

    await expect(
      publishCourseBoundEvaluation({
        academicYear: "2026-2027",
        activationAt: null,
        cilos: [{ description: "Apply capstone planning fundamentals." }],
        courseId: "course-1",
        deadlineAt: new Date("2026-05-30T00:00:00.000Z"),
        semester: "1st Semester",
        term: "Final",
        yearLevelIds: ["year-4"],
      }),
    ).resolves.toEqual({
      error: "Faculty authentication is required.",
      success: false,
    });

    expect(courseFindFirstMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("publishes a course-bound evaluation, updates scoped CILOs, and creates targets and assignments", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });
    courseFindFirstMock.mockResolvedValue({
      code: "IT-401",
      id: "course-1",
      title: "Capstone 1",
      program: {
        code: "BSIT",
        id: "program-1",
        name: "Bachelor of Science in Information Technology",
      },
    });
    instrumentVersionFindFirstMock.mockResolvedValue({
      id: "version-1",
      template: {
        code: "CILO_EVAL",
        name: "Course-Bound CILO Evaluation",
      },
    });
    ciloUpsertMock.mockResolvedValueOnce({
      description: "Apply capstone planning fundamentals.",
      id: "existing-cilo-1",
      order: 1,
    });
    ciloUpsertMock.mockResolvedValueOnce({
      description: "Produce a proposal-aligned outline defense artifact.",
      id: "new-cilo-2",
      order: 2,
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
        cilos: [
          { description: "Apply capstone planning fundamentals." },
          { description: "Produce a proposal-aligned outline defense artifact." },
        ],
        courseId: "course-1",
        deadlineAt: new Date("2026-05-30T00:00:00.000Z"),
        semester: "1st Semester",
        term: "Final",
        yearLevelIds: ["year-4", "year-4", "year-3"],
      }),
    ).resolves.toEqual({
      assignmentCount: 2,
      evaluationId: "evaluation-1",
      status: "ACTIVE",
      success: true,
      targetCount: 2,
    });

    expect(courseFindFirstMock).toHaveBeenCalledWith({
      include: {
        program: {
          select: {
            code: true,
            id: true,
            name: true,
          },
        },
      },
      where: {
        id: "course-1",
        is_active: true,
        program: {
          faculty_program_affiliations: {
            some: {
              faculty_id: "faculty-1",
              is_active: true,
            },
          },
          is_active: true,
        },
      },
    });
    expect(instrumentVersionFindFirstMock).toHaveBeenCalledWith({
      include: {
        template: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        version_number: "asc",
      },
      where: {
        is_active: true,
        template: {
          code: "CILO_EVAL",
          is_active: true,
        },
      },
    });
    expect(ciloDeleteManyMock).toHaveBeenCalledWith({
      where: {
        academic_term: "2026-2027|1st Semester|Final|program-1",
        course_id: "course-1",
        order: {
          gt: 2,
        },
      },
    });
    expect(ciloUpsertMock).toHaveBeenNthCalledWith(1, {
      create: {
        academic_term: "2026-2027|1st Semester|Final|program-1",
        course_id: "course-1",
        created_by: "faculty-1",
        description: "Apply capstone planning fundamentals.",
        order: 1,
      },
      update: {
        created_by: "faculty-1",
        description: "Apply capstone planning fundamentals.",
      },
      where: {
        course_id_academic_term_order: {
          academic_term: "2026-2027|1st Semester|Final|program-1",
          course_id: "course-1",
          order: 1,
        },
      },
    });
    expect(ciloUpsertMock).toHaveBeenNthCalledWith(2, {
      create: {
        academic_term: "2026-2027|1st Semester|Final|program-1",
        course_id: "course-1",
        created_by: "faculty-1",
        description: "Produce a proposal-aligned outline defense artifact.",
        order: 2,
      },
      update: {
        created_by: "faculty-1",
        description: "Produce a proposal-aligned outline defense artifact.",
      },
      where: {
        course_id_academic_term_order: {
          academic_term: "2026-2027|1st Semester|Final|program-1",
          course_id: "course-1",
          order: 2,
        },
      },
    });
    expect(courseBoundEvaluationCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        academic_year: "2026-2027",
        course_id: "course-1",
        faculty_id: "faculty-1",
        instrument_version_id: "version-1",
        major_id: null,
        program_id: "program-1",
        published_at: expect.any(Date),
        semester: "1st Semester",
        status: "ACTIVE",
        term: "Final",
      }),
    });
    expect(targetCreateManyMock).toHaveBeenCalledWith({
      data: [
        {
          course_bound_evaluation_id: "evaluation-1",
          program_id: "program-1",
          section_id: null,
          year_level_id: "year-4",
        },
        {
          course_bound_evaluation_id: "evaluation-1",
          program_id: "program-1",
          section_id: null,
          year_level_id: "year-3",
        },
      ],
    });
    expect(studentAcademicProfileFindManyMock).toHaveBeenCalledWith({
      select: {
        user_id: true,
      },
      where: {
        academic_year: "2026-2027",
        program_id: "program-1",
        year_level_id: {
          in: ["year-4", "year-3"],
        },
      },
    });
    expect(yearLevelFindManyMock).toHaveBeenCalledWith({
      select: { id: true },
      where: {
        id: {
          in: ["year-4", "year-3"],
        },
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

  it("removes stale extra CILOs beyond the requested scope length", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });
    courseFindFirstMock.mockResolvedValue({
      code: "IT-401",
      id: "course-1",
      title: "Capstone 1",
      program: {
        code: "BSIT",
        id: "program-1",
        name: "Bachelor of Science in Information Technology",
      },
    });
    instrumentVersionFindFirstMock.mockResolvedValue({
      id: "version-1",
      template: {
        code: "CILO_EVAL",
        name: "Course-Bound CILO Evaluation",
      },
    });
    ciloUpsertMock.mockResolvedValue({
      description: "Apply capstone planning fundamentals.",
      id: "existing-cilo-1",
      order: 1,
    });
    courseBoundEvaluationCreateMock.mockResolvedValue({ id: "evaluation-1" });
    studentAcademicProfileFindManyMock.mockResolvedValue([]);

    await expect(
      publishCourseBoundEvaluation({
        academicYear: "2026-2027",
        activationAt: null,
        cilos: [{ description: "Apply capstone planning fundamentals." }],
        courseId: "course-1",
        deadlineAt: new Date("2026-05-30T00:00:00.000Z"),
        semester: "1st Semester",
        term: "Final",
        yearLevelIds: ["year-4"],
      }),
    ).resolves.toEqual({
      assignmentCount: 0,
      evaluationId: "evaluation-1",
      status: "ACTIVE",
      success: true,
      targetCount: 1,
    });

    expect(ciloUpsertMock).toHaveBeenCalledTimes(1);
    expect(ciloDeleteManyMock).toHaveBeenCalledWith({
      where: {
        academic_term: "2026-2027|1st Semester|Final|program-1",
        course_id: "course-1",
        order: {
          gt: 1,
        },
      },
    });
  });

  it("returns a clean error when the database rejects a duplicate publish", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });
    courseFindFirstMock.mockResolvedValue({
      code: "IT-401",
      id: "course-1",
      title: "Capstone 1",
      program: {
        code: "BSIT",
        id: "program-1",
        name: "Bachelor of Science in Information Technology",
      },
    });
    instrumentVersionFindFirstMock.mockResolvedValue({
      id: "version-1",
      template: {
        code: "CILO_EVAL",
        name: "Course-Bound CILO Evaluation",
      },
    });
    ciloUpsertMock.mockResolvedValue({
      description: "Apply capstone planning fundamentals.",
      id: "existing-cilo-1",
      order: 1,
    });
    courseBoundEvaluationCreateMock.mockRejectedValue({
      code: "P2002",
      meta: {
        target: ["course_id", "academic_year", "semester", "term"],
      },
    });

    await expect(
      publishCourseBoundEvaluation({
        academicYear: "2026-2027",
        cilos: [{ description: "Apply capstone planning fundamentals." }],
        courseId: "course-1",
        semester: "1st Semester",
        term: "Final",
        yearLevelIds: ["year-4"],
      }),
    ).resolves.toEqual({
      error: "An evaluation is already published for this course context.",
      success: false,
    });

    expect(transactionMock).toHaveBeenCalledTimes(1);
  });

  it("treats duplicate context from a different faculty as the same publish conflict", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-2",
    });
    courseFindFirstMock.mockResolvedValue({
      code: "IT-401",
      id: "course-1",
      title: "Capstone 1",
      program: {
        code: "BSIT",
        id: "program-1",
        name: "Bachelor of Science in Information Technology",
      },
    });
    instrumentVersionFindFirstMock.mockResolvedValue({
      id: "version-1",
      template: {
        code: "CILO_EVAL",
        name: "Course-Bound CILO Evaluation",
      },
    });
    ciloUpsertMock.mockResolvedValue({
      description: "Apply capstone planning fundamentals.",
      id: "existing-cilo-1",
      order: 1,
    });
    courseBoundEvaluationCreateMock.mockRejectedValue({
      code: "P2002",
      meta: {
        target: ["course_id", "academic_year", "semester", "term"],
      },
    });

    await expect(
      publishCourseBoundEvaluation({
        academicYear: "2026-2027",
        cilos: [{ description: "Apply capstone planning fundamentals." }],
        courseId: "course-1",
        semester: "1st Semester",
        term: "Final",
        yearLevelIds: ["year-4"],
      }),
    ).resolves.toEqual({
      error: "An evaluation is already published for this course context.",
      success: false,
    });
  });

  it("rejects empty or whitespace-only CILO input before transaction", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });
    courseFindFirstMock.mockResolvedValue({
      code: "IT-401",
      id: "course-1",
      title: "Capstone 1",
      program: {
        code: "BSIT",
        id: "program-1",
        name: "Bachelor of Science in Information Technology",
      },
    });
    instrumentVersionFindFirstMock.mockResolvedValue({
      id: "version-1",
      template: {
        code: "CILO_EVAL",
        name: "Course-Bound CILO Evaluation",
      },
    });

    await expect(
      publishCourseBoundEvaluation({
        academicYear: "2026-2027",
        cilos: [{ description: "   " }],
        courseId: "course-1",
        semester: "1st Semester",
        term: "Final",
        yearLevelIds: ["year-4"],
      }),
    ).resolves.toEqual({
      error: "At least one CILO is required.",
      success: false,
    });

    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("does not remap unrelated unique violations to duplicate-publish error", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });
    courseFindFirstMock.mockResolvedValue({
      code: "IT-401",
      id: "course-1",
      title: "Capstone 1",
      program: {
        code: "BSIT",
        id: "program-1",
        name: "Bachelor of Science in Information Technology",
      },
    });
    instrumentVersionFindFirstMock.mockResolvedValue({
      id: "version-1",
      template: {
        code: "CILO_EVAL",
        name: "Course-Bound CILO Evaluation",
      },
    });
    ciloUpsertMock.mockRejectedValue({
      code: "P2002",
      meta: {
        target: ["course_id", "academic_term", "order"],
      },
    });

    await expect(
      publishCourseBoundEvaluation({
        academicYear: "2026-2027",
        cilos: [{ description: "Apply capstone planning fundamentals." }],
        courseId: "course-1",
        semester: "1st Semester",
        term: "Final",
        yearLevelIds: ["year-4"],
      }),
    ).rejects.toEqual({
      code: "P2002",
      meta: {
        target: ["course_id", "academic_term", "order"],
      },
    });
  });

  it("rejects unknown year levels before attempting persistence", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });
    courseFindFirstMock.mockResolvedValue({
      code: "IT-401",
      id: "course-1",
      title: "Capstone 1",
      program: {
        code: "BSIT",
        id: "program-1",
        name: "Bachelor of Science in Information Technology",
      },
    });
    instrumentVersionFindFirstMock.mockResolvedValue({
      id: "version-1",
      template: {
        code: "CILO_EVAL",
        name: "Course-Bound CILO Evaluation",
      },
    });
    yearLevelFindManyMock.mockResolvedValue([{ id: "year-4" }]);

    await expect(
      publishCourseBoundEvaluation({
        academicYear: "2026-2027",
        cilos: [{ description: "Apply capstone planning fundamentals." }],
        courseId: "course-1",
        semester: "1st Semester",
        term: "Final",
        yearLevelIds: ["year-4", "year-99"],
      }),
    ).resolves.toEqual({
      error: "One or more selected year levels are invalid.",
      success: false,
    });

    expect(transactionMock).not.toHaveBeenCalled();
  });
});
