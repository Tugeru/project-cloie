import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROLES } from "@/lib/constants/roles";
import { listFacultyCourseContexts } from "@/modules/deployments-and-targeting/services/list-faculty-course-contexts";

const { courseFindManyMock, resolveAuthSessionMock } = vi.hoisted(() => ({
  courseFindManyMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    course: {
      findMany: courseFindManyMock,
    },
  },
}));

vi.mock("@/modules/identity-access/services/resolve-auth-session", () => ({
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
    expect(courseFindManyMock).not.toHaveBeenCalled();
  });

  it("lists active course contexts within the faculty member's affiliated programs", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });
    courseFindManyMock.mockResolvedValue([
      {
        code: "IT-401",
        id: "course-1",
        title: "Capstone 1",
        program: {
          code: "BSIT",
          id: "program-1",
          name: "Bachelor of Science in Information Technology",
        },
      },
      {
        code: "IT-402",
        id: "course-2",
        title: "Capstone 2",
        program: {
          code: "BSIT",
          id: "program-1",
          name: "Bachelor of Science in Information Technology",
        },
      },
    ]);

    await expect(listFacultyCourseContexts()).resolves.toEqual([
      {
        courseCode: "IT-401",
        courseId: "course-1",
        courseTitle: "Capstone 1",
        programCode: "BSIT",
        programId: "program-1",
        programName: "Bachelor of Science in Information Technology",
      },
      {
        courseCode: "IT-402",
        courseId: "course-2",
        courseTitle: "Capstone 2",
        programCode: "BSIT",
        programId: "program-1",
        programName: "Bachelor of Science in Information Technology",
      },
    ]);

    expect(courseFindManyMock).toHaveBeenCalledWith({
      include: {
        program: {
          select: {
            code: true,
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ program: { code: "asc" } }, { code: "asc" }],
      where: {
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
  });
});
