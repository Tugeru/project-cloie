import { describe, expect, it, vi } from "vitest";
import { YearLevel } from "@prisma/client";
import {
  createCourseAssignment,
  updateCourseAssignment,
  deactivateCourseAssignment,
  bulkCreateCourseAssignments,
} from "@/features/course-assignments/services/manage-course-assignments";
import * as authModule from "@/features/auth/services/resolve-auth-session";

vi.mock("@/features/auth/services/resolve-auth-session");
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    courseAssignment: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    course: {
      findUnique: vi.fn(),
    },
  },
}));

describe("manage-course-assignments", () => {
  const mockAdminSession = {
    userId: "admin-1",
    email: "admin@test.com",
    roles: ["ADMIN"],
  };

  const mockProgramHeadSession = {
    userId: "ph-1",
    email: "ph@test.com",
    roles: ["PROGRAM_HEAD"],
  };

  const mockFacultySession = {
    userId: "faculty-1",
    email: "faculty@test.com",
    roles: ["FACULTY"],
  };

  describe("createCourseAssignment", () => {
    it("should allow admin to create assignment", async () => {
      vi.mocked(authModule.resolveAuthSession).mockResolvedValue(mockAdminSession);

      const { prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.course.findUnique).mockResolvedValue({
        id: "course-1",
        program_id: "program-1",
      } as never);
      vi.mocked(prisma.courseAssignment.create).mockResolvedValue({ id: "assignment-1" } as never);

      const result = await createCourseAssignment({
        termInstanceId: "term-1",
        facultyId: "faculty-1",
        courseId: "course-1",
        programId: "program-1",
        yearLevel: YearLevel.FIRST_YEAR,
        section: null,
      });

      expect(result.success).toBe(true);
    });

    it("should return error when faculty tries to create assignment", async () => {
      vi.mocked(authModule.resolveAuthSession).mockResolvedValue(mockFacultySession);

      const { prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.course.findUnique).mockResolvedValue({
        id: "course-1",
        program_id: "program-1",
      } as never);

      const result = await createCourseAssignment({
        termInstanceId: "term-1",
        facultyId: "faculty-1",
        courseId: "course-1",
        programId: "program-1",
        yearLevel: YearLevel.FIRST_YEAR,
        section: null,
      });

      expect(result.success).toBe(false);
    });

    it("should handle unique constraint violation", async () => {
      vi.mocked(authModule.resolveAuthSession).mockResolvedValue(mockAdminSession);

      const { prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.course.findUnique).mockResolvedValue({
        id: "course-1",
        program_id: "program-1",
      } as never);
      vi.mocked(prisma.courseAssignment.create).mockRejectedValue({
        code: "P2002",
      } as never);

      const result = await createCourseAssignment({
        termInstanceId: "term-1",
        facultyId: "faculty-1",
        courseId: "course-1",
        programId: "program-1",
        yearLevel: YearLevel.FIRST_YEAR,
        section: null,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("already exists");
      }
    });
  });

  describe("updateCourseAssignment", () => {
    it("should allow admin to update assignment", async () => {
      vi.mocked(authModule.resolveAuthSession).mockResolvedValue(mockAdminSession);

      const { prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.courseAssignment.findUnique).mockResolvedValue({
        id: "assignment-1",
        course: { program_id: "program-1" },
      } as never);
      vi.mocked(prisma.courseAssignment.update).mockResolvedValue({ id: "assignment-1" } as never);

      const result = await updateCourseAssignment({
        assignmentId: "assignment-1",
        yearLevel: YearLevel.SECOND_YEAR,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("deactivateCourseAssignment", () => {
    it("should allow admin to deactivate assignment", async () => {
      vi.mocked(authModule.resolveAuthSession).mockResolvedValue(mockAdminSession);

      const { prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.courseAssignment.findUnique).mockResolvedValue({
        id: "assignment-1",
        course: { program_id: "program-1" },
      } as never);
      vi.mocked(prisma.courseAssignment.update).mockResolvedValue({ id: "assignment-1" } as never);

      const result = await deactivateCourseAssignment("assignment-1");

      expect(result.success).toBe(true);
    });
  });

  describe("bulkCreateCourseAssignments", () => {
    it("should create multiple assignments with some errors", async () => {
      vi.mocked(authModule.resolveAuthSession).mockResolvedValue(mockAdminSession);

      const { prisma } = await import("@/lib/db/prisma");
      let callCount = 0;
      vi.mocked(prisma.course.findUnique).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          id: `course-${callCount}`,
          program_id: "program-1",
        } as never);
      });
      vi.mocked(prisma.courseAssignment.create).mockImplementation(() => {
        if (callCount === 2) {
          return Promise.reject({ code: "P2002" } as never);
        }
        return Promise.resolve({ id: `assignment-${callCount}` } as never);
      });

      const result = await bulkCreateCourseAssignments([
        {
          termInstanceId: "term-1",
          facultyId: "faculty-1",
          courseId: "course-1",
          programId: "program-1",
          yearLevel: YearLevel.FIRST_YEAR,
          section: null,
        },
        {
          termInstanceId: "term-1",
          facultyId: "faculty-2",
          courseId: "course-2",
          programId: "program-1",
          yearLevel: YearLevel.FIRST_YEAR,
          section: null,
        },
        {
          termInstanceId: "term-1",
          facultyId: "faculty-3",
          courseId: "course-3",
          programId: "program-1",
          yearLevel: YearLevel.FIRST_YEAR,
          section: null,
        },
      ]);

      expect(result.success).toBe(false);
      expect(result.created).toBe(2);
      expect(result.errors).toHaveLength(1);
    });
  });
});
