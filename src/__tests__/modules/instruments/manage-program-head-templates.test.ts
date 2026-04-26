import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROLES } from "@/lib/constants/roles";

const {
  instrumentTemplateFindManyMock,
  instrumentTemplateFindUniqueMock,
  instrumentTemplateCreateMock,
  instrumentTemplateDeleteMock,
  instrumentTemplateUpdateMock,
  instrumentVersionCreateMock,
  instrumentVersionFindFirstMock,
  instrumentVersionUpdateMock,
  programFindUniqueMock,
  programHeadAssignmentFindManyMock,
  resolveAuthSessionMock,
  transactionMock,
} = vi.hoisted(() => ({
  instrumentTemplateFindManyMock: vi.fn(),
  instrumentTemplateFindUniqueMock: vi.fn(),
  instrumentTemplateCreateMock: vi.fn(),
  instrumentTemplateDeleteMock: vi.fn(),
  instrumentTemplateUpdateMock: vi.fn(),
  instrumentVersionCreateMock: vi.fn(),
  instrumentVersionFindFirstMock: vi.fn(),
  instrumentVersionUpdateMock: vi.fn(),
  programFindUniqueMock: vi.fn(),
  programHeadAssignmentFindManyMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    instrumentTemplate: {
      findMany: instrumentTemplateFindManyMock,
      findUnique: instrumentTemplateFindUniqueMock,
      create: instrumentTemplateCreateMock,
      delete: instrumentTemplateDeleteMock,
      update: instrumentTemplateUpdateMock,
    },
    instrumentVersion: {
      create: instrumentVersionCreateMock,
      findFirst: instrumentVersionFindFirstMock,
      update: instrumentVersionUpdateMock,
    },
    program: {
      findUnique: programFindUniqueMock,
    },
    programHeadAssignment: {
      findMany: programHeadAssignmentFindManyMock,
    },
    $transaction: transactionMock,
  },
}));

vi.mock("@/features/auth/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

// ─── Test Fixtures ───────────────────────────────────────────────────────────

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
const TEMPLATE_ID = "template-1";

const VALID_STRUCTURE = [
  {
    key: "sec-1",
    title: "Industry Readiness",
    description: "Evaluate readiness",
    order: 0,
    questions: [
      {
        key: "q-1",
        prompt: "Rate communication skills",
        type: "likert" as const,
        order: 0,
        required: true,
        likertDescriptors: [
          { value: 1, label: "Strongly Disagree" },
          { value: 2, label: "Disagree" },
          { value: 3, label: "Neutral" },
          { value: 4, label: "Agree" },
          { value: 5, label: "Strongly Agree" },
        ],
      },
    ],
  },
];

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("manage-program-head-templates", () => {
  let listProgramHeadTemplates: typeof import("@/features/instruments/services/manage-program-head-templates").listProgramHeadTemplates;
  let createProgramHeadTemplate: typeof import("@/features/instruments/services/manage-program-head-templates").createProgramHeadTemplate;
  let updateProgramHeadTemplate: typeof import("@/features/instruments/services/manage-program-head-templates").updateProgramHeadTemplate;
  let duplicateTemplate: typeof import("@/features/instruments/services/manage-program-head-templates").duplicateTemplate;
  let deleteProgramHeadTemplate: typeof import("@/features/instruments/services/manage-program-head-templates").deleteProgramHeadTemplate;
  let toggleTemplateActive: typeof import("@/features/instruments/services/manage-program-head-templates").toggleTemplateActive;
  let toggleFacultyAccessible: typeof import("@/features/instruments/services/manage-program-head-templates").toggleFacultyAccessible;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default: PH is authenticated with an active program assignment
    resolveAuthSessionMock.mockResolvedValue(PH_SESSION);
    programHeadAssignmentFindManyMock.mockResolvedValue([{ program_id: PROGRAM_ID }]);

    const mod = await import("@/features/instruments/services/manage-program-head-templates");
    listProgramHeadTemplates = mod.listProgramHeadTemplates;
    createProgramHeadTemplate = mod.createProgramHeadTemplate;
    updateProgramHeadTemplate = mod.updateProgramHeadTemplate;
    duplicateTemplate = mod.duplicateTemplate;
    deleteProgramHeadTemplate = mod.deleteProgramHeadTemplate;
    toggleTemplateActive = mod.toggleTemplateActive;
    toggleFacultyAccessible = mod.toggleFacultyAccessible;
  });

  // ─── listProgramHeadTemplates ──────────────────────────────────────

  it("PH can list templates (own program + institutional baselines)", async () => {
    programFindUniqueMock.mockResolvedValue({
      id: PROGRAM_ID,
      code: "BSIT",
      name: "BS Information Technology",
    });
    instrumentTemplateFindManyMock.mockResolvedValue([
      {
        id: TEMPLATE_ID,
        code: "BSIT_INDUSTRY_EVAL",
        name: "Industry Partners Evaluation",
        description: null,
        structure: VALID_STRUCTURE,
        is_active: true,
        is_faculty_accessible: false,
        program_id: PROGRAM_ID,
        created_at: new Date(),
        updated_at: new Date(),
        versions: [
          {
            id: "ver-1",
            version_number: 1,
            is_active: true,
            created_at: new Date(),
          },
        ],
        _count: { versions: 1 },
      },
      {
        id: "baseline-1",
        code: "CILO_EVAL",
        name: "CILO Evaluation Baseline",
        description: "Institutional baseline",
        structure: [],
        is_active: true,
        is_faculty_accessible: true,
        program_id: null,
        created_at: new Date(),
        updated_at: new Date(),
        versions: [],
        _count: { versions: 0 },
      },
    ]);

    const result = await listProgramHeadTemplates();

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.templates).toHaveLength(2);

    // Program-owned template is not read-only
    const ownTemplate = result.data.templates.find((t) => t.id === TEMPLATE_ID);
    expect(ownTemplate?.isReadOnly).toBe(false);

    // Institutional baseline is read-only
    const baseline = result.data.templates.find((t) => t.id === "baseline-1");
    expect(baseline?.isReadOnly).toBe(true);
  });

  // ─── createProgramHeadTemplate ─────────────────────────────────────

  it("PH can create a program-scoped template (with first version created atomically)", async () => {
    programFindUniqueMock.mockResolvedValue({
      id: PROGRAM_ID,
      code: "BSIT",
    });

    const createdTemplate = {
      id: TEMPLATE_ID,
      code: "BSIT_INDUSTRY_PARTNERS_EVALUATION_TOOL",
    };

    transactionMock.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        instrumentTemplate: {
          create: instrumentTemplateCreateMock.mockResolvedValue(createdTemplate),
        },
        instrumentVersion: {
          create: instrumentVersionCreateMock.mockResolvedValue({
            id: "ver-1",
          }),
        },
      };
      return fn(tx);
    });

    const result = await createProgramHeadTemplate({
      name: "Industry Partners Evaluation Tool",
      description: "For evaluating industry partners.",
      is_faculty_accessible: false,
      structure: VALID_STRUCTURE,
    });

    expect(result).toEqual({
      success: true,
      data: { id: TEMPLATE_ID },
    });

    // Verify template was created with correct data
    expect(instrumentTemplateCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Industry Partners Evaluation Tool",
        description: "For evaluating industry partners.",
        program_id: PROGRAM_ID,
        is_active: true,
        is_faculty_accessible: false,
      }),
    });

    // Verify first version was created
    expect(instrumentVersionCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        template_id: TEMPLATE_ID,
        version_number: 1,
        is_active: true,
      }),
    });
  });

  it("PH cannot create template outside assigned program", async () => {
    programHeadAssignmentFindManyMock.mockResolvedValue([]);

    const result = await createProgramHeadTemplate({
      name: "Test Template",
      is_faculty_accessible: false,
      structure: VALID_STRUCTURE,
    });

    expect(result).toEqual({
      success: false,
      error: "No active program assignment found for this Program Head.",
    });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("structure JSON round-trips correctly through create", async () => {
    programFindUniqueMock.mockResolvedValue({
      id: PROGRAM_ID,
      code: "BSIT",
    });

    transactionMock.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        instrumentTemplate: {
          create: instrumentTemplateCreateMock.mockResolvedValue({
            id: TEMPLATE_ID,
          }),
        },
        instrumentVersion: {
          create: instrumentVersionCreateMock.mockResolvedValue({
            id: "ver-1",
          }),
        },
      };
      return fn(tx);
    });

    await createProgramHeadTemplate({
      name: "Test Template",
      is_faculty_accessible: false,
      structure: VALID_STRUCTURE,
    });

    // Verify the structure was passed as-is to the template
    const templateCreateCall = instrumentTemplateCreateMock.mock.calls[0][0];
    expect(templateCreateCall.data.structure).toEqual(VALID_STRUCTURE);

    // Verify the structure was also passed as snapshot to the version
    const versionCreateCall = instrumentVersionCreateMock.mock.calls[0][0];
    expect(versionCreateCall.data.structure_snapshot).toEqual(VALID_STRUCTURE);
  });

  // ─── updateProgramHeadTemplate ─────────────────────────────────────

  it("PH can update own template", async () => {
    instrumentTemplateFindUniqueMock.mockResolvedValue({
      id: TEMPLATE_ID,
      program_id: PROGRAM_ID,
      _count: { versions: 1 },
    });

    // No deployments exist
    instrumentVersionFindFirstMock.mockResolvedValue(null);

    transactionMock.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        instrumentTemplate: {
          update: instrumentTemplateUpdateMock.mockResolvedValue({
            id: TEMPLATE_ID,
          }),
        },
        instrumentVersion: {
          findFirst: instrumentVersionFindFirstMock.mockResolvedValue({
            id: "ver-1",
          }),
          update: instrumentVersionUpdateMock.mockResolvedValue({
            id: "ver-1",
          }),
        },
      };
      return fn(tx);
    });

    const result = await updateProgramHeadTemplate({
      id: TEMPLATE_ID,
      name: "Updated Name",
      description: "Updated description",
      is_faculty_accessible: true,
      structure: VALID_STRUCTURE,
    });

    expect(result).toEqual({
      success: true,
      data: { id: TEMPLATE_ID },
    });
  });

  it("PH cannot update institutional baseline template", async () => {
    instrumentTemplateFindUniqueMock.mockResolvedValue({
      id: "baseline-1",
      program_id: null,
      _count: { versions: 1 },
    });

    const result = await updateProgramHeadTemplate({
      id: "baseline-1",
      name: "Attempt update",
      is_faculty_accessible: false,
      structure: VALID_STRUCTURE,
    });

    expect(result).toEqual({
      success: false,
      error: "Institutional baseline templates cannot be modified by Program Heads.",
    });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  // ─── duplicateTemplate ─────────────────────────────────────────────

  it("PH can duplicate a template", async () => {
    programFindUniqueMock.mockResolvedValue({
      id: PROGRAM_ID,
      code: "BSIT",
    });

    instrumentTemplateFindUniqueMock.mockResolvedValue({
      name: "Original Template",
      description: "Original description",
      structure: VALID_STRUCTURE,
      is_faculty_accessible: false,
      program_id: PROGRAM_ID,
    });

    const createdDuplicate = { id: "dup-1" };
    transactionMock.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        instrumentTemplate: {
          create: instrumentTemplateCreateMock.mockResolvedValue(createdDuplicate),
        },
        instrumentVersion: {
          create: instrumentVersionCreateMock.mockResolvedValue({
            id: "ver-dup-1",
          }),
        },
      };
      return fn(tx);
    });

    const result = await duplicateTemplate(TEMPLATE_ID);

    expect(result).toEqual({
      success: true,
      data: { id: "dup-1" },
    });

    // Verify name has " (Copy)" suffix
    const createCall = instrumentTemplateCreateMock.mock.calls[0][0];
    expect(createCall.data.name).toBe("Original Template (Copy)");
    expect(createCall.data.program_id).toBe(PROGRAM_ID);
    expect(createCall.data.structure).toEqual(VALID_STRUCTURE);
  });

  // ─── toggleTemplateActive ──────────────────────────────────────────

  it("PH can delete an owned template with no deployments", async () => {
    instrumentTemplateFindUniqueMock.mockResolvedValue({
      id: TEMPLATE_ID,
      program_id: PROGRAM_ID,
      versions: [
        {
          _count: {
            course_bounds: 0,
            central_insts: 0,
          },
        },
      ],
    });
    instrumentTemplateDeleteMock.mockResolvedValue({ id: TEMPLATE_ID });

    const result = await deleteProgramHeadTemplate(TEMPLATE_ID);

    expect(result).toEqual({ success: true, data: undefined });
    expect(instrumentTemplateDeleteMock).toHaveBeenCalledWith({
      where: { id: TEMPLATE_ID },
    });
  });

  it("PH cannot delete a template with deployments", async () => {
    instrumentTemplateFindUniqueMock.mockResolvedValue({
      id: TEMPLATE_ID,
      program_id: PROGRAM_ID,
      versions: [
        {
          _count: {
            course_bounds: 1,
            central_insts: 0,
          },
        },
      ],
    });

    const result = await deleteProgramHeadTemplate(TEMPLATE_ID);

    expect(result).toEqual({
      success: false,
      error: "Templates with published deployments cannot be deleted. Deactivate them instead.",
    });
    expect(instrumentTemplateDeleteMock).not.toHaveBeenCalled();
  });

  it("PH can toggle active within program scope", async () => {
    instrumentTemplateFindUniqueMock.mockResolvedValue({
      id: TEMPLATE_ID,
      program_id: PROGRAM_ID,
      template_type: "COURSE_BOUND",
    });
    instrumentTemplateUpdateMock.mockResolvedValue({ id: TEMPLATE_ID });

    const result = await toggleTemplateActive(TEMPLATE_ID, false);

    expect(result).toEqual({ success: true, data: undefined });
    expect(instrumentTemplateUpdateMock).toHaveBeenCalledWith({
      where: { id: TEMPLATE_ID },
      data: { is_active: false },
    });
  });

  it("PH cannot toggle active on institutional baseline", async () => {
    instrumentTemplateFindUniqueMock.mockResolvedValue({
      id: "baseline-1",
      program_id: null,
    });

    const result = await toggleTemplateActive("baseline-1", false);

    expect(result).toEqual({
      success: false,
      error: "Institutional baseline templates cannot be modified.",
    });
    expect(instrumentTemplateUpdateMock).not.toHaveBeenCalled();
  });

  // ─── toggleFacultyAccessible ───────────────────────────────────────

  it("PH can toggle faculty accessible", async () => {
    instrumentTemplateFindUniqueMock.mockResolvedValue({
      id: TEMPLATE_ID,
      program_id: PROGRAM_ID,
      template_type: "COURSE_BOUND",
    });
    instrumentTemplateUpdateMock.mockResolvedValue({ id: TEMPLATE_ID });

    const result = await toggleFacultyAccessible(TEMPLATE_ID, true);

    expect(result).toEqual({ success: true, data: undefined });
    expect(instrumentTemplateUpdateMock).toHaveBeenCalledWith({
      where: { id: TEMPLATE_ID },
      data: { is_faculty_accessible: true },
    });
  });

  // ─── Unique constraint on code ─────────────────────────────────────

  it("returns error on unique constraint violation during create", async () => {
    programFindUniqueMock.mockResolvedValue({
      id: PROGRAM_ID,
      code: "BSIT",
    });

    transactionMock.mockRejectedValue({ code: "P2002" });

    const result = await createProgramHeadTemplate({
      name: "Duplicate Template",
      is_faculty_accessible: false,
      structure: VALID_STRUCTURE,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("already exists");
    }
  });

  // ─── Auth guards ─────────────────────────────────────────────────

  it("rejects unauthenticated requests", async () => {
    resolveAuthSessionMock.mockResolvedValue(null);

    const result = await createProgramHeadTemplate({
      name: "Test",
      is_faculty_accessible: false,
      structure: VALID_STRUCTURE,
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

    const result = await createProgramHeadTemplate({
      name: "Test",
      is_faculty_accessible: false,
      structure: VALID_STRUCTURE,
    });

    expect(result).toEqual({
      success: false,
      error: "Program Head authentication is required.",
    });
  });
});
