import { describe, expect, it, vi, beforeEach } from "vitest";
import { listCourseAssignmentsForProgramHead } from "@/features/course-assignments/services/list-course-assignments-for-program-head";
import * as authModule from "@/features/auth/services/resolve-auth-session";

vi.mock("@/features/auth/services/resolve-auth-session");
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    programHeadAssignment: {
      findMany: vi.fn(),
    },
    courseAssignment: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("listCourseAssignmentsForProgramHead – PH scope enforcement", () => {
  const mockPHSession = {
    userId: "ph-1",
    email: "ph@test.com",
    roles: ["PROGRAM_HEAD"],
  };

  const mockAdminSession = {
    userId: "admin-1",
    email: "admin@test.com",
    roles: ["ADMIN"],
  };

  let prisma: Awaited<typeof import("@/lib/db/prisma")>["prisma"];

  beforeEach(async () => {
    vi.clearAllMocks();
    prisma = (await import("@/lib/db/prisma")).prisma;
    // Default: return empty results so mapping doesn't fail
    vi.mocked(prisma.courseAssignment.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.courseAssignment.count).mockResolvedValue(0 as never);
  });

  it("PH without filter.programId → scoped to phProgramIds", async () => {
    vi.mocked(authModule.resolveAuthSession).mockResolvedValue(mockPHSession);
    vi.mocked(prisma.programHeadAssignment.findMany).mockResolvedValue([
      { program_id: "prog-A" },
      { program_id: "prog-B" },
    ] as never);

    await listCourseAssignmentsForProgramHead({});

    // The findMany where should constrain to PH's programs
    expect(prisma.courseAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          program_id: { in: ["prog-A", "prog-B"] },
        }),
      })
    );
  });

  it("PH with in-scope filter.programId → narrows to that single program", async () => {
    vi.mocked(authModule.resolveAuthSession).mockResolvedValue(mockPHSession);
    vi.mocked(prisma.programHeadAssignment.findMany).mockResolvedValue([
      { program_id: "prog-A" },
      { program_id: "prog-B" },
    ] as never);

    await listCourseAssignmentsForProgramHead({ programId: "prog-A" });

    expect(prisma.courseAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          program_id: "prog-A",
        }),
      })
    );
  });

  it("PH with out-of-scope filter.programId → returns empty (match nothing)", async () => {
    vi.mocked(authModule.resolveAuthSession).mockResolvedValue(mockPHSession);
    vi.mocked(prisma.programHeadAssignment.findMany).mockResolvedValue([
      { program_id: "prog-A" },
      { program_id: "prog-B" },
    ] as never);

    await listCourseAssignmentsForProgramHead({ programId: "prog-C" });

    // Should use { in: [] } which matches nothing
    expect(prisma.courseAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          program_id: { in: [] },
        }),
      })
    );
  });

  it("Admin with filter.programId → passes through freely", async () => {
    vi.mocked(authModule.resolveAuthSession).mockResolvedValue(mockAdminSession);

    await listCourseAssignmentsForProgramHead({ programId: "prog-C" });

    // Admin doesn't resolve PH assignments, so no programHeadAssignment query
    expect(prisma.programHeadAssignment.findMany).not.toHaveBeenCalled();

    // Should pass through freely
    expect(prisma.courseAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          program_id: "prog-C",
        }),
      })
    );
  });

  it("Admin without filter.programId → no program_id constraint", async () => {
    vi.mocked(authModule.resolveAuthSession).mockResolvedValue(mockAdminSession);

    await listCourseAssignmentsForProgramHead({});

    const callArgs = vi.mocked(prisma.courseAssignment.findMany).mock.calls[0][0];
    expect((callArgs as { where: Record<string, unknown> }).where).not.toHaveProperty("program_id");
  });
});
