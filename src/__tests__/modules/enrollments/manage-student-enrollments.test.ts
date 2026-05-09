import { describe, expect, it, vi, beforeEach } from "vitest";
import { EnrollmentSource, YearLevel } from "@prisma/client";
import {
  upsertEnrollmentForActiveTerm,
  adminUpsertEnrollment,
  deactivateEnrollment,
} from "@/features/enrollments/services/manage-student-enrollments";
import * as authModule from "@/features/auth/services/resolve-auth-session";

vi.mock("@/features/auth/services/resolve-auth-session");
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn((cb) => cb({
      studentEnrollment: {
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
    })),
    studentEnrollment: {
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

describe("manage-student-enrollments", () => {
  const mockAdminSession = {
    userId: "admin-1",
    email: "admin@test.com",
    roles: ["ADMIN"],
  };

  const mockStudentSession = {
    userId: "student-1",
    email: "student@test.com",
    roles: ["STUDENT"],
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("upsertEnrollmentForActiveTerm", () => {
    it("should create new enrollment when none exists", async () => {
      const { prisma } = await import("@/lib/db/prisma");
      const mockTx = {
        studentEnrollment: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "enrollment-1" }),
        },
      };
      (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation((cb) => cb(mockTx));

      const result = await upsertEnrollmentForActiveTerm({
        studentUserId: "student-1",
        termInstanceId: "term-1",
        programId: "program-1",
        majorId: null,
        yearLevel: YearLevel.FIRST_YEAR,
        section: null,
        source: EnrollmentSource.ONBOARDING,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isNew).toBe(true);
      }
    });

    it("should update existing enrollment when found", async () => {
      const { prisma } = await import("@/lib/db/prisma");
      const mockTx = {
        studentEnrollment: {
          findUnique: vi.fn().mockResolvedValue({ id: "enrollment-1" }),
          update: vi.fn().mockResolvedValue({ id: "enrollment-1" }),
        },
      };
      (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation((cb) => cb(mockTx));

      const result = await upsertEnrollmentForActiveTerm({
        studentUserId: "student-1",
        termInstanceId: "term-1",
        programId: "program-1",
        majorId: null,
        yearLevel: YearLevel.SECOND_YEAR,
        section: null,
        source: EnrollmentSource.ONBOARDING,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isNew).toBe(false);
      }
    });
  });

  describe("adminUpsertEnrollment", () => {
    it("should return error when not admin", async () => {
      vi.mocked(authModule.resolveAuthSession).mockResolvedValue(mockStudentSession);

      const result = await adminUpsertEnrollment({
        studentUserId: "student-1",
        termInstanceId: "term-1",
        programId: "program-1",
        majorId: null,
        yearLevel: YearLevel.FIRST_YEAR,
        section: null,
        source: EnrollmentSource.ADMIN,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Admin access required");
      }
    });

    it("should succeed when admin", async () => {
      vi.mocked(authModule.resolveAuthSession).mockResolvedValue(mockAdminSession);

      const { prisma } = await import("@/lib/db/prisma");
      const mockTx = {
        studentEnrollment: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "enrollment-1" }),
        },
      };
      (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation((cb) => cb(mockTx));

      const result = await adminUpsertEnrollment({
        studentUserId: "student-1",
        termInstanceId: "term-1",
        programId: "program-1",
        majorId: null,
        yearLevel: YearLevel.FIRST_YEAR,
        section: null,
        source: EnrollmentSource.ADMIN,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("deactivateEnrollment", () => {
    it("should return error when not admin", async () => {
      vi.mocked(authModule.resolveAuthSession).mockResolvedValue(mockStudentSession);

      const result = await deactivateEnrollment("enrollment-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Admin access required");
      }
    });

    it("should succeed when admin", async () => {
      vi.mocked(authModule.resolveAuthSession).mockResolvedValue(mockAdminSession);

      const { prisma } = await import("@/lib/db/prisma");
      vi.mocked(prisma.studentEnrollment.update).mockResolvedValue({ id: "enrollment-1" } as never);

      const result = await deactivateEnrollment("enrollment-1");

      expect(result.success).toBe(true);
    });
  });
});
