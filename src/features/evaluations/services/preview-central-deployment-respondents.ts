import { TargetStakeholder } from "@prisma/client";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { listStudentsForClass } from "@/features/enrollments/services/list-students-for-class";
import type {
  PreviewCentralDeploymentInput,
  PreviewCentralDeploymentRespondent,
  PreviewCentralDeploymentResult,
} from "../types";

export async function previewCentralDeploymentRespondents(
  input: PreviewCentralDeploymentInput
): Promise<PreviewCentralDeploymentResult> {
  const authSession = await resolveAuthSession();

  if (!authSession?.roles?.includes(ROLES.PROGRAM_HEAD)) {
    return {
      error: "Program Head authentication is required.",
      success: false,
    };
  }

  // Verify PH has an active assignment to the specified program
  const phAssignment = await prisma.programHeadAssignment.findFirst({
    where: {
      program_head_id: authSession.userId,
      program_id: input.programId,
      is_active: true,
    },
    select: { program_id: true },
  });

  if (!phAssignment) {
    return {
      error: "No active program assignment found for this Program Head.",
      success: false,
    };
  }

  try {
    let respondents: PreviewCentralDeploymentRespondent[] = [];

    if (input.targetStakeholder === TargetStakeholder.STUDENT) {
      respondents = await previewStudents(input);
    } else if (input.targetStakeholder === TargetStakeholder.ALUMNI) {
      respondents = await previewAlumni(input.programId);
    } else if (input.targetStakeholder === TargetStakeholder.INDUSTRY_PARTNER) {
      respondents = await previewIndustryPartners(input.programId);
    }

    return {
      respondents,
      success: true,
      totalCount: respondents.length,
    };
  } catch (error) {
    console.error("Failed to preview central deployment respondents:", error);
    return {
      error: "Failed to load respondent preview. Please try again.",
      success: false,
    };
  }
}

// ─── Student Preview ──────────────────────────────────────────────────────────

async function previewStudents(
  input: PreviewCentralDeploymentInput
): Promise<PreviewCentralDeploymentRespondent[]> {
  // Phase 7: Use enrollment-based lookup when termInstanceId is provided
  if (input.termInstanceId && input.yearLevel) {
    const studentsResult = await listStudentsForClass({
      termInstanceId: input.termInstanceId,
      programId: input.programId,
      yearLevel: input.yearLevel,
      majorId: input.majorId,
    });

    if (!studentsResult.success) {
      return [];
    }

    // Get program code for mapping
    const program = await prisma.program.findUnique({
      where: { id: input.programId },
      select: { code: true },
    });

    return studentsResult.data.map((student) => ({
      email: student.email,
      firstName: student.firstName,
      lastName: student.lastName,
      majorName: student.majorName,
      programCode: program?.code ?? null,
      section: null, // Section is not stored in enrollment for central deployment
      stakeholderType: TargetStakeholder.STUDENT,
      studentId: student.studentIdNumber,
      userId: student.userId,
      yearLevel: input.yearLevel ?? null,
    }));
  }

  // Legacy: Fall back to profile-based lookup
  const whereClause: Record<string, unknown> = {
    program_id: input.programId,
  };

  if (input.yearLevel) {
    whereClause.year_level = input.yearLevel;
  }

  if (input.majorId) {
    whereClause.major_id = input.majorId;
  }

  const profiles = await prisma.studentAcademicProfile.findMany({
    where: whereClause,
    include: {
      user: {
        select: { id: true, email: true, first_name: true, last_name: true },
      },
      program: { select: { code: true } },
      major: { select: { name: true } },
    },
    orderBy: { user: { last_name: "asc" } },
  });

  return profiles.map((p) => ({
    email: p.user.email,
    firstName: p.user.first_name,
    lastName: p.user.last_name,
    majorName: p.major?.name ?? null,
    programCode: p.program.code,
    section: p.section,
    stakeholderType: TargetStakeholder.STUDENT,
    studentId: p.student_id_number,
    userId: p.user.id,
    yearLevel: p.year_level,
  }));
}

// ─── Alumni Preview ───────────────────────────────────────────────────────────

async function previewAlumni(
  programId: string
): Promise<PreviewCentralDeploymentRespondent[]> {
  // Find accepted alumni invites scoped to the program
  const invites = await prisma.externalStakeholderInvite.findMany({
    where: {
      role: ROLES.ALUMNI,
      program_id: programId,
      status: "ACCEPTED",
    },
    select: { email: true },
  });

  if (invites.length === 0) return [];

  // Look up the actual User records by their invite emails
  const emails = invites.map((i) => i.email);
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true, first_name: true, last_name: true },
    orderBy: { last_name: "asc" },
  });

  return users.map((u) => ({
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    majorName: null,
    programCode: null,
    section: null,
    stakeholderType: TargetStakeholder.ALUMNI,
    studentId: null,
    userId: u.id,
    yearLevel: null,
  }));
}

// ─── Industry Partner Preview ─────────────────────────────────────────────────

async function previewIndustryPartners(
  programId: string
): Promise<PreviewCentralDeploymentRespondent[]> {
  const profiles = await prisma.industryPartnerProfile.findMany({
    where: { program_id: programId },
    include: {
      user: {
        select: { id: true, email: true, first_name: true, last_name: true },
      },
      program: { select: { code: true } },
    },
    orderBy: { user: { last_name: "asc" } },
  });

  return profiles.map((p) => ({
    email: p.user.email,
    firstName: p.user.first_name,
    lastName: p.user.last_name,
    majorName: null,
    programCode: p.program?.code ?? null,
    section: null,
    stakeholderType: TargetStakeholder.INDUSTRY_PARTNER,
    studentId: null,
    userId: p.user.id,
    yearLevel: null,
  }));
}
