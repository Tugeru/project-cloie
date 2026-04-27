import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROLES } from "@/lib/constants/roles";
import { listFacultyCourseContexts } from "@/features/evaluations/services/list-faculty-course-contexts";

const { affiliationFindManyMock, courseFindManyMock, resolveAuthSessionMock } = vi.hoisted(() => ({
  affiliationFindManyMock: vi.fn(),
  courseFindManyMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    facultyProgramAffiliation: {
      findMany: affiliationFindManyMock,
    },
    course: {
      findMany: courseFindManyMock,
    },
  },
}));

vi.mock("@/features/auth/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

describe("listFacultyCourseContexts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns no contexts when the signed-in user is not faculty", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.STUDENT,
      roles: [ROLES.STUDENT],
      userId: "student-1",
    });

    await expect(listFacultyCourseContexts()).resolves.toEqual([]);
    expect(affiliationFindManyMock).not.toHaveBeenCalled();
    expect(courseFindManyMock).not.toHaveBeenCalled();
  });

  it("lists active course contexts within the faculty member's affiliated programs", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });
    affiliationFindManyMock.mockResolvedValue([
      {
        program_id: "program-1",
        program: {
          code: "BSIT",
          id: "program-1",
          majors: [],
          name: "Bachelor of Science in Information Technology",
        },
      },
    ]);
    courseFindManyMock.mockResolvedValue([
      {
        code: "IT-401",
        course_scope: "PROGRAM_SPECIFIC",
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
      },
      {
        code: "GE-101",
        course_scope: "GENERAL_EDUCATION",
        id: "course-2",
        major: null,
        major_id: null,
        program: null,
        program_id: null,
        title: "General Education Foundations",
      },
    ]);

    await expect(listFacultyCourseContexts()).resolves.toEqual([
      {
        courseCode: "IT-401",
        courseId: "course-1",
        courseTitle: "Capstone 1",
        courseType: "PROGRAM_SPECIFIC",
        majorId: null,
        majorName: null,
        programCode: "BSIT",
        programId: "program-1",
        programName: "Bachelor of Science in Information Technology",
        scopeLabel: "BSIT - Shared Program Course",
      },
      {
        courseCode: "GE-101",
        courseId: "course-2",
        courseTitle: "General Education Foundations",
        courseType: "GENERAL_EDUCATION",
        majorId: null,
        majorName: null,
        programCode: "BSIT",
        programId: "program-1",
        programName: "Bachelor of Science in Information Technology",
        scopeLabel: "BSIT - General Education",
      },
    ]);

    expect(affiliationFindManyMock).toHaveBeenCalledWith({
      where: {
        faculty_id: "faculty-1",
        is_active: true,
        program: {
          is_active: true,
        },
      },
      include: {
        program: {
          include: {
            majors: {
              where: { is_active: true },
              orderBy: { name: "asc" },
            },
          },
        },
      },
      orderBy: { program: { code: "asc" } },
    });
    expect(courseFindManyMock).toHaveBeenCalledWith({
      where: {
        is_active: true,
        OR: [
          {
            program_id: {
              in: ["program-1"],
            },
          },
          {
            course_scope: "GENERAL_EDUCATION",
          },
        ],
      },
      include: {
        major: true,
        program: true,
      },
      orderBy: [{ course_scope: "asc" }, { code: "asc" }],
    });
  });
});
