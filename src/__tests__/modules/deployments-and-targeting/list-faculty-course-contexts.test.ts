import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROLES } from "@/lib/constants/roles";
import { listFacultyCourseContexts } from "@/features/evaluations/services/list-faculty-course-contexts";

const { affiliationFindManyMock, courseAssignmentFindManyMock, courseFindManyMock, resolveAuthSessionMock } = vi.hoisted(() => ({
  affiliationFindManyMock: vi.fn(),
  courseAssignmentFindManyMock: vi.fn(),
  courseFindManyMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    facultyProgramAffiliation: {
      findMany: affiliationFindManyMock,
    },
    courseAssignment: {
      findMany: courseAssignmentFindManyMock,
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
      },
    ]);
    // First call returns course IDs
    courseFindManyMock.mockResolvedValueOnce([
      { id: "course-1" },
      { id: "course-2" },
    ]);
    // Second call returns full course details
    courseFindManyMock.mockResolvedValueOnce([
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
        programCode: "",
        programId: "",
        programName: "",
        scopeLabel: " - General Education",
      },
    ]);

    expect(affiliationFindManyMock).toHaveBeenCalledWith({
      where: {
        faculty_id: "faculty-1",
        is_active: true,
      },
      select: { program_id: true },
    });
    // First call - get course IDs
    expect(courseFindManyMock).toHaveBeenNthCalledWith(1, {
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
      select: { id: true },
    });
    // Second call - get full course details
    expect(courseFindManyMock).toHaveBeenNthCalledWith(2, {
      where: {
        id: { in: ["course-1", "course-2"] },
        is_active: true,
      },
      include: {
        major: true,
        program: true,
      },
      orderBy: [{ course_scope: "asc" }, { code: "asc" }],
    });
  });

  it("lists course contexts from course assignments when termInstanceId is provided", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });

    courseAssignmentFindManyMock.mockResolvedValue([
      { course_id: "course-1" },
      { course_id: "course-2" },
    ]);

    courseFindManyMock.mockResolvedValue([
      {
        code: "CS-101",
        course_scope: "PROGRAM_SPECIFIC",
        id: "course-1",
        major: null,
        major_id: null,
        program: {
          code: "BSCS",
          id: "program-1",
          name: "Computer Science",
        },
        program_id: "program-1",
        title: "Intro to CS",
      },
      {
        code: "CS-201",
        course_scope: "PROGRAM_SPECIFIC",
        id: "course-2",
        major: null,
        major_id: null,
        program: {
          code: "BSCS",
          id: "program-1",
          name: "Computer Science",
        },
        program_id: "program-1",
        title: "Data Structures",
      },
    ]);

    await expect(listFacultyCourseContexts("term-instance-1")).resolves.toEqual([
      {
        courseCode: "CS-101",
        courseId: "course-1",
        courseTitle: "Intro to CS",
        courseType: "PROGRAM_SPECIFIC",
        majorId: null,
        majorName: null,
        programCode: "BSCS",
        programId: "program-1",
        programName: "Computer Science",
        scopeLabel: "BSCS - Shared Program Course",
      },
      {
        courseCode: "CS-201",
        courseId: "course-2",
        courseTitle: "Data Structures",
        courseType: "PROGRAM_SPECIFIC",
        majorId: null,
        majorName: null,
        programCode: "BSCS",
        programId: "program-1",
        programName: "Computer Science",
        scopeLabel: "BSCS - Shared Program Course",
      },
    ]);

    // Should call courseAssignment, not facultyProgramAffiliation
    expect(courseAssignmentFindManyMock).toHaveBeenCalledWith({
      where: {
        faculty_id: "faculty-1",
        term_instance_id: "term-instance-1",
        is_active: true,
      },
      select: { course_id: true },
    });
    expect(affiliationFindManyMock).not.toHaveBeenCalled();

    expect(courseFindManyMock).toHaveBeenCalledWith({
      where: {
        id: { in: ["course-1", "course-2"] },
        is_active: true,
      },
      include: {
        major: true,
        program: true,
      },
      orderBy: [{ course_scope: "asc" }, { code: "asc" }],
    });
  });

  it("returns empty array when no course assignments found for term", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });

    courseAssignmentFindManyMock.mockResolvedValue([]);

    await expect(listFacultyCourseContexts("term-with-no-assignments")).resolves.toEqual([]);
    expect(courseAssignmentFindManyMock).toHaveBeenCalled();
    expect(courseFindManyMock).not.toHaveBeenCalled();
  });
});
