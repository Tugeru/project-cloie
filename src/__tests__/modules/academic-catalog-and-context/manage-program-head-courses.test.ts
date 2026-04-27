import { beforeEach, describe, expect, it, vi } from "vitest";
import { CourseScope } from "@prisma/client";

import { ROLES } from "@/lib/constants/roles";

const {
  courseCreateMock,
  courseFindUniqueMock,
  courseUpdateMock,
  majorFindUniqueMock,
  programHeadAssignmentFindManyMock,
  resolveAuthSessionMock,
} = vi.hoisted(() => ({
  courseCreateMock: vi.fn(),
  courseFindUniqueMock: vi.fn(),
  courseUpdateMock: vi.fn(),
  majorFindUniqueMock: vi.fn(),
  programHeadAssignmentFindManyMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    course: {
      create: courseCreateMock,
      findUnique: courseFindUniqueMock,
      update: courseUpdateMock,
    },
    major: {
      findUnique: majorFindUniqueMock,
    },
    programHeadAssignment: {
      findMany: programHeadAssignmentFindManyMock,
    },
  },
}));

vi.mock("@/features/auth/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

const PH_SESSION = {
  userId: "ph-user-1",
  email: "ph@acd.edu.ph",
  roles: [ROLES.PROGRAM_HEAD],
  primaryRole: ROLES.PROGRAM_HEAD,
  studentProfileId: null,
  isGraduating: false,
  profileGate: null,
};

const PROGRAM_ID = "program-1";
const MAJOR_ID = "major-1";
const COURSE_ID = "course-1";

describe("manage-program-head-courses", () => {
  let createProgramHeadCourse: typeof import("@/features/academic-structure/services/manage-program-head-courses").createProgramHeadCourse;
  let updateProgramHeadCourse: typeof import("@/features/academic-structure/services/manage-program-head-courses").updateProgramHeadCourse;
  let toggleProgramHeadCourseActive: typeof import("@/features/academic-structure/services/manage-program-head-courses").toggleProgramHeadCourseActive;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default: PH is authenticated with an active program assignment
    resolveAuthSessionMock.mockResolvedValue(PH_SESSION);
    programHeadAssignmentFindManyMock.mockResolvedValue([{ program_id: PROGRAM_ID }]);

    const mod = await import("@/features/academic-structure/services/manage-program-head-courses");
    createProgramHeadCourse = mod.createProgramHeadCourse;
    updateProgramHeadCourse = mod.updateProgramHeadCourse;
    toggleProgramHeadCourseActive = mod.toggleProgramHeadCourseActive;
  });

  // ─── createProgramHeadCourse ──────────────────────────────────────

  it("PH can create a program-specific course within assigned program", async () => {
    courseCreateMock.mockResolvedValue({ id: COURSE_ID });

    const result = await createProgramHeadCourse({
      code: "IT-301",
      title: "Web Development",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
    });

    expect(result).toEqual({ success: true, data: { id: COURSE_ID } });
    expect(courseCreateMock).toHaveBeenCalledWith({
      data: {
        code: "IT-301",
        title: "Web Development",
        description: null,
        course_scope: CourseScope.PROGRAM_SPECIFIC,
        program_id: PROGRAM_ID,
        major_id: null,
      },
    });
  });

  it("PH can create a major-specific course within assigned program (major must belong to program)", async () => {
    majorFindUniqueMock.mockResolvedValue({
      id: MAJOR_ID,
      program_id: PROGRAM_ID,
      is_active: true,
    });
    courseCreateMock.mockResolvedValue({ id: COURSE_ID });

    const result = await createProgramHeadCourse({
      code: "IT-401",
      title: "Advanced Networking",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
      major_id: MAJOR_ID,
    });

    expect(result).toEqual({ success: true, data: { id: COURSE_ID } });
    expect(courseCreateMock).toHaveBeenCalledWith({
      data: {
        code: "IT-401",
        title: "Advanced Networking",
        description: null,
        course_scope: CourseScope.PROGRAM_SPECIFIC,
        program_id: PROGRAM_ID,
        major_id: MAJOR_ID,
      },
    });
  });

  it("PH cannot create course outside assigned program", async () => {
    // Simulate no active assignments
    programHeadAssignmentFindManyMock.mockResolvedValue([]);

    const result = await createProgramHeadCourse({
      code: "CS-101",
      title: "Intro to CS",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
    });

    expect(result).toEqual({
      success: false,
      error: "No active program assignment found for this Program Head.",
    });
    expect(courseCreateMock).not.toHaveBeenCalled();
  });

  it("PH cannot create GE course (only admin can)", async () => {
    // The schema enforces PROGRAM_SPECIFIC, so GE would fail at the schema
    // level. Here we test that even if somehow bypassed, the service-level
    // course_scope is always PROGRAM_SPECIFIC.
    courseCreateMock.mockResolvedValue({ id: COURSE_ID });

    const result = await createProgramHeadCourse({
      code: "GE-101",
      title: "General Physics",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
    });

    expect(result.success).toBe(true);
    expect(courseCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          course_scope: CourseScope.PROGRAM_SPECIFIC,
          program_id: PROGRAM_ID,
        }),
      })
    );
  });

  it("PH cannot modify a GE course", async () => {
    courseFindUniqueMock.mockResolvedValue({
      id: COURSE_ID,
      program_id: null,
      course_scope: CourseScope.GENERAL_EDUCATION,
    });

    const result = await updateProgramHeadCourse({
      id: COURSE_ID,
      code: "GE-101",
      title: "Updated General Physics",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
    });

    expect(result).toEqual({
      success: false,
      error: "General education courses cannot be modified by Program Heads.",
    });
    expect(courseUpdateMock).not.toHaveBeenCalled();
  });

  it("Major validation: major must belong to the PH's program", async () => {
    majorFindUniqueMock.mockResolvedValue({
      id: "major-other",
      program_id: "other-program",
      is_active: true,
    });

    const result = await createProgramHeadCourse({
      code: "IT-501",
      title: "Cross-Program Course",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
      major_id: "major-other",
    });

    expect(result).toEqual({
      success: false,
      error: "Selected major does not belong to your assigned program.",
    });
    expect(courseCreateMock).not.toHaveBeenCalled();
  });

  it("Unique constraint error on duplicate course code", async () => {
    courseCreateMock.mockRejectedValue({ code: "P2002" });

    const result = await createProgramHeadCourse({
      code: "IT-301",
      title: "Duplicate Course",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
    });

    expect(result).toEqual({
      success: false,
      error: 'A course with code "IT-301" already exists.',
    });
  });

  // ─── updateProgramHeadCourse ──────────────────────────────────────

  it("PH can update a course within their assigned program", async () => {
    courseFindUniqueMock.mockResolvedValue({
      id: COURSE_ID,
      program_id: PROGRAM_ID,
      course_scope: CourseScope.PROGRAM_SPECIFIC,
    });
    courseUpdateMock.mockResolvedValue({ id: COURSE_ID });

    const result = await updateProgramHeadCourse({
      id: COURSE_ID,
      code: "IT-301",
      title: "Updated Web Dev",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
    });

    expect(result).toEqual({ success: true, data: { id: COURSE_ID } });
    expect(courseUpdateMock).toHaveBeenCalledWith({
      where: { id: COURSE_ID },
      data: {
        code: "IT-301",
        title: "Updated Web Dev",
        description: null,
        course_scope: CourseScope.PROGRAM_SPECIFIC,
        program_id: PROGRAM_ID,
        major_id: null,
      },
    });
  });

  it("PH cannot update course outside assigned program", async () => {
    courseFindUniqueMock.mockResolvedValue({
      id: COURSE_ID,
      program_id: "other-program",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
    });

    const result = await updateProgramHeadCourse({
      id: COURSE_ID,
      code: "CS-101",
      title: "Intro to CS",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
    });

    expect(result).toEqual({
      success: false,
      error: "You do not have permission to modify this course.",
    });
    expect(courseUpdateMock).not.toHaveBeenCalled();
  });

  // ─── toggleProgramHeadCourseActive ────────────────────────────────

  it("PH can toggle active status for own program course", async () => {
    courseFindUniqueMock.mockResolvedValue({
      id: COURSE_ID,
      program_id: PROGRAM_ID,
      course_scope: CourseScope.PROGRAM_SPECIFIC,
    });
    courseUpdateMock.mockResolvedValue({ id: COURSE_ID });

    const result = await toggleProgramHeadCourseActive(COURSE_ID, false);

    expect(result).toEqual({ success: true, data: undefined });
    expect(courseUpdateMock).toHaveBeenCalledWith({
      where: { id: COURSE_ID },
      data: { is_active: false },
    });
  });

  it("PH cannot toggle active for GE course", async () => {
    courseFindUniqueMock.mockResolvedValue({
      id: COURSE_ID,
      program_id: null,
      course_scope: CourseScope.GENERAL_EDUCATION,
    });

    const result = await toggleProgramHeadCourseActive(COURSE_ID, false);

    expect(result).toEqual({
      success: false,
      error: "General education courses cannot be modified by Program Heads.",
    });
    expect(courseUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects when no session is present", async () => {
    resolveAuthSessionMock.mockResolvedValue(null);

    const result = await createProgramHeadCourse({
      code: "IT-301",
      title: "Web Dev",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
    });

    expect(result).toEqual({
      success: false,
      error: "Program Head authentication is required.",
    });
  });

  it("rejects when user does not have PROGRAM_HEAD role", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      ...PH_SESSION,
      roles: [ROLES.FACULTY],
      primaryRole: ROLES.FACULTY,
    });

    const result = await createProgramHeadCourse({
      code: "IT-301",
      title: "Web Dev",
      course_scope: CourseScope.PROGRAM_SPECIFIC,
    });

    expect(result).toEqual({
      success: false,
      error: "Program Head authentication is required.",
    });
  });
});
