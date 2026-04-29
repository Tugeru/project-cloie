import { InviteStatus, SystemRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  AssignRoleInput,
  CreateExternalInviteDraftInput,
  CreateFacultyAffiliationInput,
  CreateProgramHeadAssignmentInput,
  UpdateIndustryPartnerProfileInput,
  UpdateStudentAcademicContextInput,
} from "../schemas/admin-user";

type ServiceResult<T = void> = { success: true; data: T } | { success: false; error: string };

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

async function userHasRole(userId: string, role: SystemRole) {
  const record = await prisma.userRole.findUnique({
    where: {
      user_id_role: {
        user_id: userId,
        role,
      },
    },
    select: { id: true },
  });

  return Boolean(record);
}

async function ensureProgramMajorRelation(programId: string, majorId?: string) {
  if (!majorId) {
    return { success: true as const };
  }

  const major = await prisma.major.findUnique({
    where: { id: majorId },
    select: { id: true, program_id: true },
  });

  if (!major) {
    return { success: false as const, error: "Selected major was not found." };
  }

  if (major.program_id !== programId) {
    return {
      success: false as const,
      error: "Selected major does not belong to the selected program.",
    };
  }

  return { success: true as const };
}

async function listAdminUsers() {
  return prisma.user.findMany({
    include: {
      roles: {
        orderBy: { role: "asc" },
      },
      student_profile: {
        include: {
          major: true,
          program: true,
          year_level: true,
        },
      },
      faculty_program_affiliations: {
        orderBy: {
          program: {
            code: "asc",
          },
        },
        include: {
          program: true,
        },
      },
      program_head_assignments: {
        orderBy: {
          program: {
            code: "asc",
          },
        },
        include: {
          program: true,
        },
      },
      industry_partner_profile: {
        include: {
          program: true,
        },
      },
    },
    orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
  });
}

async function listExternalStakeholderInvites() {
  return prisma.externalStakeholderInvite.findMany({
    include: {
      program: true,
    },
    orderBy: [{ status: "asc" }, { created_at: "desc" }],
  });
}

export async function toggleUserActive(id: string, is_active: boolean): Promise<ServiceResult> {
  await prisma.user.update({
    where: { id },
    data: { is_active },
  });

  return { success: true, data: undefined };
}

export async function assignUserRole(
  input: AssignRoleInput
): Promise<ServiceResult<{ id: string }>> {
  try {
    const role = await prisma.userRole.create({
      data: {
        user_id: input.user_id,
        role: input.role,
      },
    });

    return { success: true, data: { id: role.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: `${input.role.replaceAll("_", " ")} is already assigned to this user.`,
      };
    }

    throw error;
  }
}

export async function revokeUserRole(userId: string, role: SystemRole): Promise<ServiceResult> {
  const assignedRole = await prisma.userRole.findUnique({
    where: {
      user_id_role: {
        user_id: userId,
        role,
      },
    },
  });

  if (!assignedRole) {
    return { success: false, error: "Role assignment not found." };
  }

  if (role === SystemRole.STUDENT) {
    const profile = await prisma.studentAcademicProfile.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });

    if (profile) {
      return {
        success: false,
        error: "Remove the student academic context before revoking the Student role.",
      };
    }
  }

  if (role === SystemRole.FACULTY) {
    const activeAffiliations = await prisma.facultyProgramAffiliation.count({
      where: {
        faculty_id: userId,
        is_active: true,
      },
    });

    if (activeAffiliations > 0) {
      return {
        success: false,
        error: "Deactivate all faculty-program affiliations before revoking the Faculty role.",
      };
    }
  }

  if (role === SystemRole.PROGRAM_HEAD) {
    const activeAssignments = await prisma.programHeadAssignment.count({
      where: {
        program_head_id: userId,
        is_active: true,
      },
    });

    if (activeAssignments > 0) {
      return {
        success: false,
        error: "Deactivate all program-head assignments before revoking the Program Head role.",
      };
    }
  }

  if (role === SystemRole.INDUSTRY_PARTNER) {
    const profile = await prisma.industryPartnerProfile.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });

    if (profile) {
      return {
        success: false,
        error: "Remove the industry partner profile before revoking the Industry Partner role.",
      };
    }
  }

  await prisma.userRole.delete({
    where: {
      user_id_role: {
        user_id: userId,
        role,
      },
    },
  });

  return { success: true, data: undefined };
}

export async function upsertStudentAcademicContext(
  input: UpdateStudentAcademicContextInput
): Promise<ServiceResult> {
  const hasStudentRole = await userHasRole(input.user_id, SystemRole.STUDENT);

  if (!hasStudentRole) {
    return {
      success: false,
      error: "Assign the Student role before saving academic context.",
    };
  }

  const programMajorCheck = await ensureProgramMajorRelation(input.program_id, input.major_id);

  if (!programMajorCheck.success) {
    return programMajorCheck;
  }

  await prisma.studentAcademicProfile.upsert({
    where: { user_id: input.user_id },
    update: {
      program_id: input.program_id,
      major_id: input.major_id ?? null,
      year_level_id: input.year_level_id,
      student_id_number: input.student_id_number ?? null,
      academic_year: input.academic_year,
    },
    create: {
      user_id: input.user_id,
      program_id: input.program_id,
      major_id: input.major_id ?? null,
      year_level_id: input.year_level_id,
      student_id_number: input.student_id_number ?? null,
      academic_year: input.academic_year,
    },
  });

  return { success: true, data: undefined };
}

export async function deleteStudentAcademicContext(userId: string): Promise<ServiceResult> {
  const profile = await prisma.studentAcademicProfile.findUnique({
    where: { user_id: userId },
    select: { id: true },
  });

  if (!profile) {
    return { success: false, error: "Student academic context not found." };
  }

  await prisma.studentAcademicProfile.delete({
    where: { user_id: userId },
  });

  return { success: true, data: undefined };
}

export async function createFacultyProgramAffiliation(
  input: CreateFacultyAffiliationInput
): Promise<ServiceResult> {
  const hasFacultyRole = await userHasRole(input.faculty_id, SystemRole.FACULTY);

  if (!hasFacultyRole) {
    return {
      success: false,
      error: "Assign the Faculty role before adding a faculty-program affiliation.",
    };
  }

  try {
    await prisma.facultyProgramAffiliation.upsert({
      where: {
        faculty_id_program_id: {
          faculty_id: input.faculty_id,
          program_id: input.program_id,
        },
      },
      update: {
        is_active: true,
      },
      create: {
        faculty_id: input.faculty_id,
        program_id: input.program_id,
        is_active: true,
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: "This faculty-program affiliation already exists.",
      };
    }

    throw error;
  }
}

export async function deactivateFacultyProgramAffiliation(id: string): Promise<ServiceResult> {
  await prisma.facultyProgramAffiliation.update({
    where: { id },
    data: {
      is_active: false,
    },
  });

  return { success: true, data: undefined };
}

export async function createProgramHeadAssignment(
  input: CreateProgramHeadAssignmentInput
): Promise<ServiceResult> {
  const hasProgramHeadRole = await userHasRole(input.program_head_id, SystemRole.PROGRAM_HEAD);

  if (!hasProgramHeadRole) {
    return {
      success: false,
      error: "Assign the Program Head role before linking a program assignment.",
    };
  }

  try {
    await prisma.programHeadAssignment.upsert({
      where: {
        program_head_id_program_id: {
          program_head_id: input.program_head_id,
          program_id: input.program_id,
        },
      },
      update: {
        is_active: true,
      },
      create: {
        program_head_id: input.program_head_id,
        program_id: input.program_id,
        is_active: true,
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: "This program-head assignment already exists.",
      };
    }

    throw error;
  }
}

export async function deactivateProgramHeadAssignment(id: string): Promise<ServiceResult> {
  await prisma.programHeadAssignment.update({
    where: { id },
    data: {
      is_active: false,
    },
  });

  return { success: true, data: undefined };
}

export async function upsertIndustryPartnerProfile(
  input: UpdateIndustryPartnerProfileInput
): Promise<ServiceResult> {
  const hasIndustryRole = await userHasRole(input.user_id, SystemRole.INDUSTRY_PARTNER);

  if (!hasIndustryRole) {
    return {
      success: false,
      error: "Assign the Industry Partner role before saving a partner profile.",
    };
  }

  await prisma.industryPartnerProfile.upsert({
    where: { user_id: input.user_id },
    update: {
      company_name: input.company_name,
      position: input.position ?? null,
      program_id: input.program_id ?? null,
    },
    create: {
      user_id: input.user_id,
      company_name: input.company_name,
      position: input.position ?? null,
      program_id: input.program_id ?? null,
    },
  });

  return { success: true, data: undefined };
}

export async function deleteIndustryPartnerProfile(userId: string): Promise<ServiceResult> {
  const profile = await prisma.industryPartnerProfile.findUnique({
    where: { user_id: userId },
    select: { id: true },
  });

  if (!profile) {
    return { success: false, error: "Industry partner profile not found." };
  }

  await prisma.industryPartnerProfile.delete({
    where: { user_id: userId },
  });

  return { success: true, data: undefined };
}

export async function createExternalInviteDraft(
  input: CreateExternalInviteDraftInput
): Promise<ServiceResult<{ id: string }>> {
  try {
    const invite = await prisma.externalStakeholderInvite.create({
      data: {
        email: input.email,
        role: input.role,
        program_id: input.program_id ?? null,
        invitee_name: input.invitee_name ?? null,
        company_name: input.company_name ?? null,
        note: input.note ?? null,
        status: InviteStatus.DRAFT,
      },
    });

    return { success: true, data: { id: invite.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: "An invite draft already exists for this email, role, and program.",
      };
    }

    throw error;
  }
}

export async function updateExternalInviteStatus(
  id: string,
  status: InviteStatus
): Promise<ServiceResult> {
  const invite = await prisma.externalStakeholderInvite.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!invite) {
    return { success: false, error: "Invite draft not found." };
  }

  if (invite.status === InviteStatus.ACCEPTED && status !== InviteStatus.ACCEPTED) {
    return {
      success: false,
      error: "Accepted invites cannot be reverted from the admin draft flow.",
    };
  }

  await prisma.externalStakeholderInvite.update({
    where: { id },
    data: {
      status,
    },
  });

  return { success: true, data: undefined };
}
