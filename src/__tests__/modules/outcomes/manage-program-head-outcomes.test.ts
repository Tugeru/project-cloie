import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROLES } from "@/lib/constants/roles";

const {
  goCreateMock,
  goDeleteMock,
  goFindManyMock,
  goFindUniqueMock,
  goUpdateMock,
  programFindUniqueMock,
  programHeadAssignmentFindManyMock,
  resolveAuthSessionMock,
  transactionMock,
  courseFindManyMock,
} = vi.hoisted(() => ({
  goCreateMock: vi.fn(),
  goDeleteMock: vi.fn(),
  goFindManyMock: vi.fn(),
  goFindUniqueMock: vi.fn(),
  goUpdateMock: vi.fn(),
  programFindUniqueMock: vi.fn(),
  programHeadAssignmentFindManyMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
  transactionMock: vi.fn(),
  courseFindManyMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    gO: {
      create: goCreateMock,
      delete: goDeleteMock,
      findMany: goFindManyMock,
      findUnique: goFindUniqueMock,
      update: goUpdateMock,
    },
    program: {
      findUnique: programFindUniqueMock,
    },
    programHeadAssignment: {
      findMany: programHeadAssignmentFindManyMock,
    },
    course: {
      findMany: courseFindManyMock,
    },
    $transaction: transactionMock,
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
const GO_ID = "go-1";

describe("manage-program-head-outcomes", () => {
  let listProgramGOs: typeof import("@/features/outcomes/services/manage-program-head-outcomes").listProgramGOs;
  let createGO: typeof import("@/features/outcomes/services/manage-program-head-outcomes").createGO;
  let updateGO: typeof import("@/features/outcomes/services/manage-program-head-outcomes").updateGO;
  let deleteGO: typeof import("@/features/outcomes/services/manage-program-head-outcomes").deleteGO;
  let reorderGOs: typeof import("@/features/outcomes/services/manage-program-head-outcomes").reorderGOs;
  let listCILOMappingsForProgram: typeof import("@/features/outcomes/services/manage-program-head-outcomes").listCILOMappingsForProgram;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default: PH is authenticated with an active program assignment
    resolveAuthSessionMock.mockResolvedValue(PH_SESSION);
    programHeadAssignmentFindManyMock.mockResolvedValue([
      { program_id: PROGRAM_ID },
    ]);

    const mod = await import(
      "@/features/outcomes/services/manage-program-head-outcomes"
    );
    listProgramGOs = mod.listProgramGOs;
    createGO = mod.createGO;
    updateGO = mod.updateGO;
    deleteGO = mod.deleteGO;
    reorderGOs = mod.reorderGOs;
    listCILOMappingsForProgram = mod.listCILOMappingsForProgram;
  });

  // ─── listProgramGOs ──────────────────────────────────────────────────

  it("PH can list GOs for assigned program", async () => {
    programFindUniqueMock.mockResolvedValue({
      id: PROGRAM_ID,
      code: "BSIT",
      name: "BS Information Technology",
    });
    goFindManyMock.mockResolvedValue([
      {
        id: GO_ID,
        code: "GO-1",
        description: "Critical Thinking",
        order: 0,
        is_active: true,
        program_id: PROGRAM_ID,
        created_at: new Date(),
        updated_at: new Date(),
        _count: { cilo_mappings: 2 },
      },
    ]);

    const result = await listProgramGOs();

    expect(result).toEqual({
      success: true,
      data: {
        gos: expect.arrayContaining([
          expect.objectContaining({
            id: GO_ID,
            code: "GO-1",
            _count: { cilo_mappings: 2 },
          }),
        ]),
        program: {
          id: PROGRAM_ID,
          code: "BSIT",
          name: "BS Information Technology",
        },
      },
    });
  });

  // ─── createGO ────────────────────────────────────────────────────────

  it("PH can create a GO within assigned program", async () => {
    goCreateMock.mockResolvedValue({ id: GO_ID });

    const result = await createGO({
      code: "GO-1",
      description: "Critical Thinking",
      order: 0,
    });

    expect(result).toEqual({ success: true, data: { id: GO_ID } });
    expect(goCreateMock).toHaveBeenCalledWith({
      data: {
        code: "GO-1",
        description: "Critical Thinking",
        order: 0,
        program_id: PROGRAM_ID,
      },
    });
  });

  it("PH cannot create GO outside assigned program", async () => {
    // Simulate no active assignments
    programHeadAssignmentFindManyMock.mockResolvedValue([]);

    const result = await createGO({
      code: "GO-1",
      description: "Critical Thinking",
      order: 0,
    });

    expect(result).toEqual({
      success: false,
      error: "No active program assignment found for this Program Head.",
    });
    expect(goCreateMock).not.toHaveBeenCalled();
  });

  it("unique constraint error on duplicate GO code within program", async () => {
    goCreateMock.mockRejectedValue({ code: "P2002" });

    const result = await createGO({
      code: "GO-1",
      description: "Duplicate GO",
      order: 0,
    });

    expect(result).toEqual({
      success: false,
      error: 'A GO with code "GO-1" already exists in this program.',
    });
  });

  // ─── updateGO ────────────────────────────────────────────────────────

  it("PH can update a GO within scope", async () => {
    goFindUniqueMock.mockResolvedValue({
      id: GO_ID,
      program_id: PROGRAM_ID,
    });
    goUpdateMock.mockResolvedValue({ id: GO_ID });

    const result = await updateGO({
      id: GO_ID,
      code: "GO-1-UPDATED",
      description: "Updated description",
      order: 1,
    });

    expect(result).toEqual({ success: true, data: { id: GO_ID } });
    expect(goUpdateMock).toHaveBeenCalledWith({
      where: { id: GO_ID },
      data: {
        code: "GO-1-UPDATED",
        description: "Updated description",
        order: 1,
      },
    });
  });

  it("PH cannot update GO outside scope", async () => {
    goFindUniqueMock.mockResolvedValue({
      id: GO_ID,
      program_id: "other-program",
    });

    const result = await updateGO({
      id: GO_ID,
      code: "GO-1",
      description: "Attempt update",
      order: 0,
    });

    expect(result).toEqual({
      success: false,
      error: "You do not have permission to modify this Graduate Outcome.",
    });
    expect(goUpdateMock).not.toHaveBeenCalled();
  });

  // ─── deleteGO ────────────────────────────────────────────────────────

  it("PH can delete GO with no mappings", async () => {
    goFindUniqueMock.mockResolvedValue({
      id: GO_ID,
      program_id: PROGRAM_ID,
      _count: { cilo_mappings: 0 },
    });
    goDeleteMock.mockResolvedValue({ id: GO_ID });

    const result = await deleteGO(GO_ID);

    expect(result).toEqual({ success: true, data: undefined });
    expect(goDeleteMock).toHaveBeenCalledWith({ where: { id: GO_ID } });
  });

  it("PH cannot delete GO with existing CILO mappings", async () => {
    goFindUniqueMock.mockResolvedValue({
      id: GO_ID,
      program_id: PROGRAM_ID,
      _count: { cilo_mappings: 3 },
    });

    const result = await deleteGO(GO_ID);

    expect(result).toEqual({
      success: false,
      error:
        "Cannot delete GO with existing CILO mappings. Remove mappings first.",
    });
    expect(goDeleteMock).not.toHaveBeenCalled();
  });

  // ─── reorderGOs ──────────────────────────────────────────────────────

  it("reorder validates all IDs belong to PH's program", async () => {
    goFindManyMock.mockResolvedValue([
      { id: "go-1", program_id: PROGRAM_ID },
      { id: "go-2", program_id: "other-program" },
    ]);

    const result = await reorderGOs(["go-1", "go-2"]);

    expect(result).toEqual({
      success: false,
      error: "You do not have permission to reorder these Graduate Outcomes.",
    });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("reorder succeeds when all IDs belong to PH's program", async () => {
    goFindManyMock.mockResolvedValue([
      { id: "go-1", program_id: PROGRAM_ID },
      { id: "go-2", program_id: PROGRAM_ID },
    ]);
    transactionMock.mockResolvedValue([]);

    const result = await reorderGOs(["go-2", "go-1"]);

    expect(result).toEqual({ success: true, data: undefined });
    expect(transactionMock).toHaveBeenCalled();
  });

  // ─── Auth guards ─────────────────────────────────────────────────────

  it("rejects unauthenticated requests", async () => {
    resolveAuthSessionMock.mockResolvedValue(null);

    const result = await createGO({
      code: "GO-1",
      description: "Test",
      order: 0,
    });

    expect(result).toEqual({
      success: false,
      error: "Program Head authentication is required.",
    });
  });

  it("rejects non-PROGRAM_HEAD role", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      ...PH_SESSION,
      roles: [ROLES.FACULTY],
      primaryRole: ROLES.FACULTY,
    });

    const result = await createGO({
      code: "GO-1",
      description: "Test",
      order: 0,
    });

    expect(result).toEqual({
      success: false,
      error: "Program Head authentication is required.",
    });
  });
});
