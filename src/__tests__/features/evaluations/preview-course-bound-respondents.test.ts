import { beforeEach, describe, expect, it, vi } from "vitest";
import { YearLevel, StudentSection } from "@prisma/client";
import { previewCourseBoundRespondents } from "@/features/evaluations/services/preview-course-bound-respondents";
import { ROLES } from "@/lib/constants/roles";

const {
  findUniqueAssignmentMock,
  listStudentsForClassMock,
  resolveAuthSessionMock,
} = vi.hoisted(() => ({
  findUniqueAssignmentMock: vi.fn(),
  listStudentsForClassMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    courseAssignment: {
      findUnique: findUniqueAssignmentMock,
    },
  },
}));

vi.mock("@/features/auth/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

vi.mock("@/features/enrollments/services/list-students-for-class", () => ({
  listStudentsForClass: listStudentsForClassMock,
}));

const MOCK_ASSIGNMENT = {
  id: "assignment-1",
  faculty_id: "faculty-1",
  is_active: true,
  term_instance_id: "term-1",
  program_id: "program-1",
  year_level: YearLevel.FIRST_YEAR,
  section: StudentSection.MORNING,
  program: {
    id: "program-1",
    code: "BSCS",
    name: "BS Computer Science",
  },
};

describe("previewCourseBoundRespondents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthorized access when session is missing or user is not faculty", async () => {
    resolveAuthSessionMock.mockResolvedValue(null);

    const result = await previewCourseBoundRespondents({ assignmentId: "assignment-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Faculty authentication is required.");
    }
  });

  it("returns error if course assignment is not found", async () => {
    resolveAuthSessionMock.mockResolvedValue({ userId: "faculty-1", roles: [ROLES.FACULTY] });
    findUniqueAssignmentMock.mockResolvedValue(null);

    const result = await previewCourseBoundRespondents({ assignmentId: "assignment-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Course assignment not found.");
    }
  });

  it("returns error if course assignment belongs to a different faculty", async () => {
    resolveAuthSessionMock.mockResolvedValue({ userId: "faculty-2", roles: [ROLES.FACULTY] });
    findUniqueAssignmentMock.mockResolvedValue(MOCK_ASSIGNMENT);

    const result = await previewCourseBoundRespondents({ assignmentId: "assignment-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("You do not have access to this course assignment.");
    }
  });

  it("returns error if course assignment is inactive", async () => {
    resolveAuthSessionMock.mockResolvedValue({ userId: "faculty-1", roles: [ROLES.FACULTY] });
    findUniqueAssignmentMock.mockResolvedValue({
      ...MOCK_ASSIGNMENT,
      is_active: false,
    });

    const result = await previewCourseBoundRespondents({ assignmentId: "assignment-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("This course assignment is inactive.");
    }
  });

  it("returns list of respondents mapped correctly from students list", async () => {
    resolveAuthSessionMock.mockResolvedValue({ userId: "faculty-1", roles: [ROLES.FACULTY] });
    findUniqueAssignmentMock.mockResolvedValue(MOCK_ASSIGNMENT);
    listStudentsForClassMock.mockResolvedValue({
      success: true,
      data: [
        {
          userId: "student-1",
          email: "student1@school.edu",
          firstName: "John",
          lastName: "Doe",
          studentIdNumber: "S2025-001",
          majorId: null,
          majorName: null,
        },
      ],
    });

    const result = await previewCourseBoundRespondents({ assignmentId: "assignment-1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        email: "student1@school.edu",
        firstName: "John",
        lastName: "Doe",
        majorId: null,
        majorName: null,
        programCode: "BSCS",
        programId: "program-1",
        programName: "BS Computer Science",
        section: StudentSection.MORNING,
        studentId: "S2025-001",
        userId: "student-1",
        yearLevel: YearLevel.FIRST_YEAR,
      });
    }

    expect(listStudentsForClassMock).toHaveBeenCalledWith({
      termInstanceId: "term-1",
      programId: "program-1",
      yearLevel: YearLevel.FIRST_YEAR,
      section: StudentSection.MORNING,
    });
  });
});
