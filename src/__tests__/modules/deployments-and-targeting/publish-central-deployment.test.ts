import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROLES } from "@/lib/constants/roles";
import { publishCentralDeployment } from "@/features/evaluations/services/publish-central-deployment";

const {
  assignmentCreateManyMock,
  centralDeploymentCreateMock,
  centralDeploymentFindFirstMock,
  academicTermInstanceFindUniqueMock,
  externalStakeholderInviteFindManyMock,
  industryPartnerProfileFindManyMock,
  instrumentTemplateFindFirstMock,
  instrumentVersionFindFirstMock,
  listStudentsForClassMock,
  programHeadAssignmentFindFirstMock,
  resolveAuthSessionMock,
  studentAcademicProfileFindManyMock,
  transactionMock,
  txUserFindManyMock,
  userRoleFindManyMock,
} = vi.hoisted(() => ({
  assignmentCreateManyMock: vi.fn(),
  centralDeploymentCreateMock: vi.fn(),
  centralDeploymentFindFirstMock: vi.fn(),
  academicTermInstanceFindUniqueMock: vi.fn(),
  externalStakeholderInviteFindManyMock: vi.fn(),
  industryPartnerProfileFindManyMock: vi.fn(),
  instrumentTemplateFindFirstMock: vi.fn(),
  instrumentVersionFindFirstMock: vi.fn(),
  listStudentsForClassMock: vi.fn(),
  programHeadAssignmentFindFirstMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
  studentAcademicProfileFindManyMock: vi.fn(),
  transactionMock: vi.fn(),
  txUserFindManyMock: vi.fn(),
  userRoleFindManyMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
    academicTermInstance: {
      findUnique: academicTermInstanceFindUniqueMock,
    },
    centralDeployment: {
      findFirst: centralDeploymentFindFirstMock,
    },
    instrumentTemplate: {
      findFirst: instrumentTemplateFindFirstMock,
    },
    instrumentVersion: {
      findFirst: instrumentVersionFindFirstMock,
    },
    programHeadAssignment: {
      findFirst: programHeadAssignmentFindFirstMock,
    },
  },
}));

vi.mock("@/features/enrollments/services/list-students-for-class", () => ({
  listStudentsForClass: listStudentsForClassMock,
}));

vi.mock("@/features/auth/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

// ─── Test Helpers ────────────────────────────────────────────────────────────

function mockAuthenticatedPH() {
  resolveAuthSessionMock.mockResolvedValue({
    primaryRole: ROLES.PROGRAM_HEAD,
    roles: [ROLES.PROGRAM_HEAD],
    userId: "ph-user-1",
  });
}

function mockPHAssignment(programId = "program-1") {
  programHeadAssignmentFindFirstMock.mockResolvedValue({
    program_id: programId,
  });
}

function mockTemplate(overrides: Record<string, unknown> = {}) {
  instrumentTemplateFindFirstMock.mockResolvedValue({
    id: "template-1",
    name: "Exit Survey Tool",
    program_id: "program-1",
    ...overrides,
  });
}

function mockVersion(overrides: Record<string, unknown> = {}) {
  instrumentVersionFindFirstMock.mockResolvedValue({
    id: "version-1",
    ...overrides,
  });
}

function mockNoDuplicate() {
  centralDeploymentFindFirstMock.mockResolvedValue(null);
}

function setupTransaction() {
  transactionMock.mockImplementation(async (callback) =>
    callback({
      centralDeployment: { create: centralDeploymentCreateMock },
      evaluationAssignment: { createMany: assignmentCreateManyMock },
      externalStakeholderInvite: { findMany: externalStakeholderInviteFindManyMock },
      industryPartnerProfile: { findMany: industryPartnerProfileFindManyMock },
      studentAcademicProfile: { findMany: studentAcademicProfileFindManyMock },
      user: { findMany: txUserFindManyMock },
      userRole: { findMany: userRoleFindManyMock },
    })
  );
}

const baseInput = {
  template_id: "template-1",
  deployment_name: "Graduate Exit Evaluation",
  target_stakeholder: "STUDENT" as const,
  term_instance_id: "term-instance-1",
  year_level: "FOURTH_YEAR" as const,
};

function mockTermInstance() {
  academicTermInstanceFindUniqueMock.mockResolvedValue({
    id: "term-instance-1",
    semester: "FIRST",
    term: null,
    school_year: { code: "2025-2026" },
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("publishCentralDeployment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupTransaction();
  });

  // ─── Auth Tests ──────────────────────────────────────────────────────────

  it("rejects unauthenticated requests", async () => {
    resolveAuthSessionMock.mockResolvedValue(null);

    const result = await publishCentralDeployment(baseInput);

    expect(result).toEqual({
      success: false,
      error: "Program Head authentication is required.",
    });
  });

  it("rejects non-PROGRAM_HEAD role", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      userId: "faculty-1",
    });

    const result = await publishCentralDeployment(baseInput);

    expect(result).toEqual({
      success: false,
      error: "Program Head authentication is required.",
    });
  });

  it("rejects PH without active program assignment", async () => {
    mockAuthenticatedPH();
    programHeadAssignmentFindFirstMock.mockResolvedValue(null);

    const result = await publishCentralDeployment(baseInput);

    expect(result).toEqual({
      success: false,
      error: "No active program assignment found for this Program Head.",
    });
  });

  // ─── Template Validation ─────────────────────────────────────────────────

  it("validates template belongs to PH's program or is institutional baseline", async () => {
    mockAuthenticatedPH();
    mockPHAssignment("program-1");
    // Template not found (e.g., belongs to another program)
    instrumentTemplateFindFirstMock.mockResolvedValue(null);

    const result = await publishCentralDeployment(baseInput);

    expect(result).toEqual({
      success: false,
      error: "Template not found, inactive, or not accessible to your program.",
    });

    // Verify the query uses the correct OR condition
    expect(instrumentTemplateFindFirstMock).toHaveBeenCalledWith({
      where: {
        id: "template-1",
        is_active: true,
        OR: [{ program_id: "program-1" }, { program_id: null }],
        template_type: "PROGRAM_WIDE",
      },
      select: { id: true, name: true, program_id: true, template_type: true },
    });
  });

  it("rejects when no active version exists for the template", async () => {
    mockAuthenticatedPH();
    mockPHAssignment();
    mockTemplate();
    instrumentVersionFindFirstMock.mockResolvedValue(null);
    mockNoDuplicate();

    const result = await publishCentralDeployment(baseInput);

    expect(result).toEqual({
      success: false,
      error: "No active instrument version found for this template.",
    });
  });

  // ─── Date Validation ─────────────────────────────────────────────────────

  it("validates deadline > activation when both set", async () => {
    mockAuthenticatedPH();
    mockPHAssignment();
    mockTemplate();
    mockVersion();
    mockNoDuplicate();

    const result = await publishCentralDeployment({
      ...baseInput,
      activation_at: new Date("2026-06-01T00:00:00Z"),
      deadline_at: new Date("2026-05-01T00:00:00Z"), // Before activation
    });

    expect(result).toEqual({
      success: false,
      error: "Deadline must be after the activation date.",
    });
  });

  // ─── Duplicate Prevention ────────────────────────────────────────────────

  it("prevents duplicate deployment (same version + program + stakeholder + academic period)", async () => {
    mockAuthenticatedPH();
    mockPHAssignment();
    mockTemplate();
    mockVersion();
    centralDeploymentFindFirstMock.mockResolvedValue({
      id: "existing-deployment-1",
    });

    const result = await publishCentralDeployment(baseInput);

    expect(result).toEqual({
      success: false,
      error:
        "A deployment already exists for this template version, program, stakeholder, and academic period.",
    });
  });

  // ─── Graduating Student Deployment ───────────────────────────────────────

  it("PH can create a central deployment for graduating students", async () => {
    mockAuthenticatedPH();
    mockPHAssignment();
    mockTemplate();
    mockVersion();
    mockNoDuplicate();
    mockTermInstance();

    centralDeploymentCreateMock.mockResolvedValue({
      id: "deployment-1",
    });
    listStudentsForClassMock.mockResolvedValue({
      success: true,
      data: [
        { userId: "student-1" },
        { userId: "student-2" },
        { userId: "student-3" },
      ],
    });

    const result = await publishCentralDeployment({
      ...baseInput,
      target_stakeholder: "STUDENT",
      year_level: "FOURTH_YEAR",
    });

    expect(result).toEqual({
      success: true,
      data: {
        deploymentId: "deployment-1",
        assignmentCount: 3,
        status: "ACTIVE",
      },
    });

    // Verify deployment was created with correct data
    expect(centralDeploymentCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        instrument_version_id: "version-1",
        deployment_name: "Graduate Exit Evaluation",
        program_id: "program-1",
        target_stakeholder: "STUDENT",
        term_instance_id: "term-instance-1",
        year_level: "FOURTH_YEAR",
        status: "ACTIVE",
      }),
    });

    // Verify enrollment-based student lookup
    expect(listStudentsForClassMock).toHaveBeenCalledWith({
      termInstanceId: "term-instance-1",
      programId: "program-1",
      yearLevel: "FOURTH_YEAR",
      majorId: undefined,
    });

    // Verify assignments were created
    expect(assignmentCreateManyMock).toHaveBeenCalledWith({
      data: [
        { central_deployment_id: "deployment-1", respondent_id: "student-1" },
        { central_deployment_id: "deployment-1", respondent_id: "student-2" },
        { central_deployment_id: "deployment-1", respondent_id: "student-3" },
      ],
    });
  });

  it("creates assignments for matching graduating students with major filter", async () => {
    mockAuthenticatedPH();
    mockPHAssignment();
    mockTemplate();
    mockVersion();
    mockNoDuplicate();
    mockTermInstance();

    centralDeploymentCreateMock.mockResolvedValue({
      id: "deployment-2",
    });
    listStudentsForClassMock.mockResolvedValue({
      success: true,
      data: [{ userId: "student-5" }],
    });

    const result = await publishCentralDeployment({
      ...baseInput,
      target_stakeholder: "STUDENT",
      major_id: "major-1",
      year_level: "FOURTH_YEAR",
    });

    expect(result).toEqual({
      success: true,
      data: {
        deploymentId: "deployment-2",
        assignmentCount: 1,
        status: "ACTIVE",
      },
    });

    expect(listStudentsForClassMock).toHaveBeenCalledWith({
      termInstanceId: "term-instance-1",
      programId: "program-1",
      yearLevel: "FOURTH_YEAR",
      majorId: "major-1",
    });
  });

  // ─── Alumni Deployment ───────────────────────────────────────────────────

  it("PH can create a central deployment for alumni", async () => {
    mockAuthenticatedPH();
    mockPHAssignment();
    mockTemplate();
    mockVersion();
    mockNoDuplicate();
    mockTermInstance();

    externalStakeholderInviteFindManyMock.mockResolvedValue([
      { email: "alumni1@example.com" },
      { email: "alumni2@example.com" },
    ]);
    txUserFindManyMock.mockResolvedValue([
      { id: "alumni-1" },
      { id: "alumni-2" },
    ]);

    centralDeploymentCreateMock.mockResolvedValue({
      id: "deployment-3",
    });

    const result = await publishCentralDeployment({
      ...baseInput,
      target_stakeholder: "ALUMNI",
      year_level: undefined,
    });

    expect(result).toEqual({
      success: true,
      data: {
        deploymentId: "deployment-3",
        assignmentCount: 2,
        status: "ACTIVE",
      },
    });

    // Verify alumni invite query
    expect(externalStakeholderInviteFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ role: ROLES.ALUMNI }),
      })
    );

    // Verify assignments were created for alumni
    expect(assignmentCreateManyMock).toHaveBeenCalledWith({
      data: [
        { central_deployment_id: "deployment-3", respondent_id: "alumni-1" },
        { central_deployment_id: "deployment-3", respondent_id: "alumni-2" },
      ],
    });
  });

  // ─── Industry Partner Deployment ─────────────────────────────────────────

  it("PH can create a central deployment for industry partners", async () => {
    mockAuthenticatedPH();
    mockPHAssignment();
    mockTemplate();
    mockVersion();
    mockNoDuplicate();
    mockTermInstance();

    centralDeploymentCreateMock.mockResolvedValue({
      id: "deployment-4",
    });
    industryPartnerProfileFindManyMock.mockResolvedValue([
      { user_id: "ip-1" },
      { user_id: "ip-2" },
    ]);

    const result = await publishCentralDeployment({
      ...baseInput,
      target_stakeholder: "INDUSTRY_PARTNER",
      year_level: undefined,
    });

    expect(result).toEqual({
      success: true,
      data: {
        deploymentId: "deployment-4",
        assignmentCount: 2,
        status: "ACTIVE",
      },
    });

    // Verify industry partner profile query with program filter
    expect(industryPartnerProfileFindManyMock).toHaveBeenCalledWith({
      where: { program_id: "program-1" },
      select: { user_id: true },
    });

    // Verify assignments were created for industry partners
    expect(assignmentCreateManyMock).toHaveBeenCalledWith({
      data: [
        { central_deployment_id: "deployment-4", respondent_id: "ip-1" },
        { central_deployment_id: "deployment-4", respondent_id: "ip-2" },
      ],
    });
  });

  // ─── Scope Validation ────────────────────────────────────────────────────

  it("validates PH scope — cannot deploy outside assigned program", async () => {
    mockAuthenticatedPH();
    mockPHAssignment("program-1");
    // Template belongs to program-2 (not accessible)
    instrumentTemplateFindFirstMock.mockResolvedValue(null);

    const result = await publishCentralDeployment({
      ...baseInput,
      template_id: "template-from-other-program",
    });

    expect(result).toEqual({
      success: false,
      error: "Template not found, inactive, or not accessible to your program.",
    });
  });

  // ─── Scheduled Status ────────────────────────────────────────────────────

  it("sets SCHEDULED status when activation_at is in the future", async () => {
    mockAuthenticatedPH();
    mockPHAssignment();
    mockTemplate();
    mockVersion();
    mockNoDuplicate();
    mockTermInstance();

    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    centralDeploymentCreateMock.mockResolvedValue({
      id: "deployment-5",
    });
    listStudentsForClassMock.mockResolvedValue({ success: true, data: [] });

    const result = await publishCentralDeployment({
      ...baseInput,
      activation_at: futureDate,
      deadline_at: new Date(futureDate.getTime() + 30 * 24 * 60 * 60 * 1000),
    });

    expect(result).toEqual({
      success: true,
      data: {
        deploymentId: "deployment-5",
        assignmentCount: 0,
        status: "SCHEDULED",
      },
    });

    expect(centralDeploymentCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "SCHEDULED",
      }),
    });
  });

  // ─── Unique Constraint Error Handling ────────────────────────────────────

  it("handles unique constraint error from database gracefully", async () => {
    mockAuthenticatedPH();
    mockPHAssignment();
    mockTemplate();
    mockVersion();
    mockNoDuplicate();
    mockTermInstance();

    transactionMock.mockRejectedValue({
      code: "P2002",
      meta: { target: ["instrument_version_id", "program_id"] },
    });

    const result = await publishCentralDeployment(baseInput);

    expect(result).toEqual({
      success: false,
      error:
        "A deployment already exists for this template version, program, stakeholder, and academic period.",
    });
  });

  // ─── Deduplication of Respondent IDs ─────────────────────────────────────

  it("deduplicates respondent IDs when using the respondent_ids path", async () => {
    mockAuthenticatedPH();
    mockPHAssignment();
    mockTemplate();
    mockVersion();
    mockNoDuplicate();
    mockTermInstance();

    centralDeploymentCreateMock.mockResolvedValue({
      id: "deployment-6",
    });

    // Pass duplicate respondent IDs explicitly (respondent_ids path applies dedup)
    const result = await publishCentralDeployment({
      ...baseInput,
      target_stakeholder: "STUDENT",
      respondent_ids: ["student-1", "student-1", "student-2"],
    });

    expect(result).toEqual({
      success: true,
      data: {
        deploymentId: "deployment-6",
        assignmentCount: 2,
        status: "ACTIVE",
      },
    });

    expect(assignmentCreateManyMock).toHaveBeenCalledWith({
      data: [
        { central_deployment_id: "deployment-6", respondent_id: "student-1" },
        { central_deployment_id: "deployment-6", respondent_id: "student-2" },
      ],
    });
  });
});
