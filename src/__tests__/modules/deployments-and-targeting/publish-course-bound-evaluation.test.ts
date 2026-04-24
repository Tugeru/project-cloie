import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AcademicSemester,
  AcademicTerm,
  CourseScope,
} from "@prisma/client";

import { ROLES } from "@/lib/constants/roles";
import { publishCourseBoundEvaluation } from "@/features/evaluations/services/publish-course-bound-evaluation";

const {
  assignmentCreateManyMock,
  ciloDeleteManyMock,
  ciloUpsertMock,
  courseBoundEvaluationCreateMock,
  courseFindFirstMock,
  instrumentVersionFindFirstMock,
  programFindFirstMock,
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
  programFindFirstMock: vi.fn(),
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
    program: {
      findFirst: programFindFirstMock,
    },
    yearLevel: {
      findMany: yearLevelFindManyMock,
    },
  },
}));

vi.mock("@/features/auth/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

describe("publishCourseBoundEvaluation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    yearLevelFindManyMock.mockImplementation(async ({ where }) => where.id.in.map((id: string) => ({ id })));

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
        programId: "program-1",
        semester: AcademicSemester.FIRST,
        term: AcademicTerm.FIRST_TERM,
        yearLevelIds: ["year-4"],
      }),
    ).resolves.toEqual({
      error: "Faculty authentication is required.",
      success: false,
    });
  });

  it("publishes a course-bound evaluation and creates targets and assignments", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });
    courseFindFirstMock.mockResolvedValue({
      code: "IT-401",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
      id: "course-1",
      major: null,
      major_id: null,
      program: {
        code: "BSIT",
        id: "program-1",
        name: "Bachelor of Science in Information Technology",
      },
      program_id: "program-1",
      title: "Capstone 1",
    });
    programFindFirstMock.mockResolvedValue({
      code: "BSIT",
      id: "program-1",
      majors: [],
      name: "Bachelor of Science in Information Technology",
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
      id: "cilo-1",
      order: 1,
    });
    ciloUpsertMock.mockResolvedValueOnce({
      description: "Produce a proposal-aligned outline defense artifact.",
      id: "cilo-2",
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
        programId: "program-1",
        semester: AcademicSemester.FIRST,
        term: AcademicTerm.FIRST_TERM,
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
      where: {
        id: "course-1",
        is_active: true,
      },
      include: {
        major: true,
        program: {
          select: {
            code: true,
            id: true,
            name: true,
          },
        },
      },
    });
    expect(programFindFirstMock).toHaveBeenCalledWith({
      where: {
        id: "program-1",
        is_active: true,
        faculty_program_affiliations: {
          some: {
            faculty_id: "faculty-1",
            is_active: true,
          },
        },
      },
      include: {
        majors: {
          where: { is_active: true },
        },
      },
    });
    expect(ciloDeleteManyMock).toHaveBeenCalledWith({
      where: {
        academic_term: "2026-2027|FIRST|FIRST_TERM|program-1",
        course_id: "course-1",
        order: {
          gt: 2,
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
        semester: AcademicSemester.FIRST,
        term: AcademicTerm.FIRST_TERM,
      }),
    });
    expect(studentAcademicProfileFindManyMock).toHaveBeenCalledWith({
      where: {
        academic_year: "2026-2027",
        program_id: "program-1",
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

  it("requires a matching major for major-scoped courses", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });
    courseFindFirstMock.mockResolvedValue({
      code: "MKT301",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
      id: "course-1",
      major: { id: "major-1", name: "Marketing Management" },
      major_id: "major-1",
      program: {
        code: "BSBA",
        id: "program-1",
        name: "Bachelor of Science in Business Administration",
      },
      program_id: "program-1",
      title: "Strategic Marketing",
    });
    programFindFirstMock.mockResolvedValue({
      code: "BSBA",
      id: "program-1",
      majors: [{ id: "major-1", name: "Marketing Management" }],
      name: "Bachelor of Science in Business Administration",
    });

    await expect(
      publishCourseBoundEvaluation({
        academicYear: "2026-2027",
        cilos: [{ description: "CILO 1" }],
        courseId: "course-1",
        programId: "program-1",
        semester: AcademicSemester.FIRST,
        term: AcademicTerm.FIRST_TERM,
        yearLevelIds: ["year-4"],
      }),
    ).resolves.toEqual({
      error: "A matching major must be selected for this course.",
      success: false,
    });
  });

  it("maps duplicate course-context publishes to a user-facing error", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });
    courseFindFirstMock.mockResolvedValue({
      code: "IT-401",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
      id: "course-1",
      major: null,
      major_id: null,
      program: {
        code: "BSIT",
        id: "program-1",
        name: "Bachelor of Science in Information Technology",
      },
      program_id: "program-1",
      title: "Capstone 1",
    });
    programFindFirstMock.mockResolvedValue({
      code: "BSIT",
      id: "program-1",
      majors: [],
      name: "Bachelor of Science in Information Technology",
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
      id: "cilo-1",
      order: 1,
    });
    transactionMock.mockRejectedValue({
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
        programId: "program-1",
        semester: AcademicSemester.FIRST,
        term: AcademicTerm.FIRST_TERM,
        yearLevelIds: ["year-4"],
      }),
    ).resolves.toEqual({
      error: "An evaluation is already published for this course context.",
      success: false,
    });
  });
});
