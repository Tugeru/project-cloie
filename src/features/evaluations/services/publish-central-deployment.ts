import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import type { PublishCentralDeploymentInput } from "../schemas/central-deployment";
import {
  DeploymentStatus,
  EvaluationTemplateType,
  type AcademicSemester,
  type TargetStakeholder,
} from "@prisma/client";

// ─── Types ───────────────────────────────────────────────────────────────────

type ServiceResult<T = void> = { success: true; data: T } | { success: false; error: string };

export type PublishCentralDeploymentResult = ServiceResult<{
  deploymentId: string;
  assignmentCount: number;
  status: "ACTIVE" | "SCHEDULED";
}>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeDeploymentStatus(activationAt: Date | undefined): "ACTIVE" | "SCHEDULED" {
  if (activationAt && activationAt.getTime() > Date.now()) {
    return DeploymentStatus.SCHEDULED;
  }

  return DeploymentStatus.ACTIVE;
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

// ─── Main Service ────────────────────────────────────────────────────────────

export async function publishCentralDeployment(
  input: PublishCentralDeploymentInput
): Promise<PublishCentralDeploymentResult> {
  // 1. Authenticate and check role
  const authSession = await resolveAuthSession();

  if (!authSession?.roles?.includes(ROLES.PROGRAM_HEAD)) {
    return {
      success: false,
      error: "Program Head authentication is required.",
    };
  }

  if (!input.deployment_name.trim()) {
    return {
      success: false,
      error: "Deployment name is required.",
    };
  }

  if (input.target_stakeholder === "STUDENT" && !input.year_level_id) {
    return {
      success: false,
      error: "Year level is required when publishing to students.",
    };
  }

  // 2. Resolve PH's program assignment
  const phAssignment = await prisma.programHeadAssignment.findFirst({
    where: {
      program_head_id: authSession.userId,
      is_active: true,
    },
    select: { program_id: true },
  });

  if (!phAssignment) {
    return {
      success: false,
      error: "No active program assignment found for this Program Head.",
    };
  }

  const programId = phAssignment.program_id;

  // 3. Validate template — must be active and owned by PH's program or institutional baseline
  const template = await prisma.instrumentTemplate.findFirst({
    where: {
      id: input.template_id,
      is_active: true,
      OR: [{ program_id: programId }, { program_id: null }],
      template_type: EvaluationTemplateType.PROGRAM_WIDE,
    },
    select: { id: true, name: true, program_id: true, template_type: true },
  });

  if (!template) {
    return {
      success: false,
      error: "Template not found, inactive, or not accessible to your program.",
    };
  }

  // 4. Get the latest active InstrumentVersion for the template
  const latestVersion = await prisma.instrumentVersion.findFirst({
    where: {
      template_id: template.id,
      is_active: true,
    },
    orderBy: { version_number: "desc" },
    select: { id: true },
  });

  if (!latestVersion) {
    return {
      success: false,
      error: "No active instrument version found for this template.",
    };
  }

  // 5. Validate deadline > activation if both are set
  if (input.activation_at && input.deadline_at) {
    if (input.deadline_at.getTime() <= input.activation_at.getTime()) {
      return {
        success: false,
        error: "Deadline must be after the activation date.",
      };
    }
  }

  // 6. Compute deployment status
  const status = computeDeploymentStatus(input.activation_at);

  // 7. Check for duplicate deployment
  const existingDeployment = await prisma.centralDeployment.findFirst({
    where: {
      instrument_version_id: latestVersion.id,
      program_id: programId,
      target_stakeholder: input.target_stakeholder as TargetStakeholder,
      academic_year: input.academic_year,
      semester: input.semester as AcademicSemester,
      year_level_id: input.year_level_id ?? null,
    },
    select: { id: true },
  });

  if (existingDeployment) {
    return {
      success: false,
      error:
        "A deployment already exists for this template version, program, stakeholder, and academic period.",
    };
  }

  // 8. Transaction: create deployment + assignments
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 8a. Create the CentralDeployment record
      const deployment = await tx.centralDeployment.create({
        data: {
          instrument_version_id: latestVersion.id,
          deployment_name: input.deployment_name,
          program_id: programId,
          major_id: input.major_id ?? null,
          year_level_id: input.year_level_id ?? null,
          target_stakeholder: input.target_stakeholder as TargetStakeholder,
          academic_year: input.academic_year,
          semester: input.semester as AcademicSemester,
          activation_at: input.activation_at ?? null,
          deadline_at: input.deadline_at ?? null,
          status,
        },
      });

      // 8b. Create EvaluationAssignment records for target respondents
      let respondentIds: string[] = [];

      if (input.respondent_ids && input.respondent_ids.length > 0) {
        // Use the curated list from preview/exclude flow
        respondentIds = [...new Set(input.respondent_ids)];
      } else if (input.target_stakeholder === "STUDENT") {
        const whereClause: Record<string, unknown> = {
          program_id: programId,
          year_level_id: input.year_level_id,
        };

        if (input.major_id) {
          whereClause.major_id = input.major_id;
        }

        const studentProfiles = await tx.studentAcademicProfile.findMany({
          where: whereClause,
          select: { user_id: true },
        });

        respondentIds = [...new Set(studentProfiles.map((p) => p.user_id))];
      } else if (input.target_stakeholder === "ALUMNI") {
        // Find accepted alumni invites scoped to this program
        const invites = await tx.externalStakeholderInvite.findMany({
          where: {
            role: ROLES.ALUMNI,
            program_id: programId,
            status: "ACCEPTED",
          },
          select: { email: true },
        });

        if (invites.length > 0) {
          const emails = invites.map((i) => i.email);
          const users = await tx.user.findMany({
            where: { email: { in: emails } },
            select: { id: true },
          });
          respondentIds = [...new Set(users.map((u) => u.id))];
        }
      } else if (input.target_stakeholder === "INDUSTRY_PARTNER") {
        // Find users with INDUSTRY_PARTNER role and matching program
        const industryProfiles = await tx.industryPartnerProfile.findMany({
          where: { program_id: programId },
          select: { user_id: true },
        });

        respondentIds = [...new Set(industryProfiles.map((p) => p.user_id))];
      }

      if (respondentIds.length > 0) {
        await tx.evaluationAssignment.createMany({
          data: respondentIds.map((respondentId) => ({
            central_deployment_id: deployment.id,
            respondent_id: respondentId,
          })),
        });
      }

      return {
        deploymentId: deployment.id,
        assignmentCount: respondentIds.length,
        status,
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error:
          "A deployment already exists for this template version, program, stakeholder, and academic period.",
      };
    }

    throw error;
  }
}

// ─── Close Deployment ────────────────────────────────────────────────────────

export type CloseCentralDeploymentResult = ServiceResult;

export async function closeCentralDeployment(
  deploymentId: string
): Promise<CloseCentralDeploymentResult> {
  // 1. Authenticate and check role
  const authSession = await resolveAuthSession();

  if (!authSession?.roles?.includes(ROLES.PROGRAM_HEAD)) {
    return {
      success: false,
      error: "Program Head authentication is required.",
    };
  }

  // 2. Resolve PH's program assignment
  const phAssignment = await prisma.programHeadAssignment.findFirst({
    where: {
      program_head_id: authSession.userId,
      is_active: true,
    },
    select: { program_id: true },
  });

  if (!phAssignment) {
    return {
      success: false,
      error: "No active program assignment found for this Program Head.",
    };
  }

  // 3. Load the deployment
  const deployment = await prisma.centralDeployment.findUnique({
    where: { id: deploymentId },
    select: { id: true, program_id: true, status: true },
  });

  if (!deployment) {
    return { success: false, error: "Deployment not found." };
  }

  // 4. Validate scope — PH must own the program
  if (deployment.program_id !== phAssignment.program_id) {
    return {
      success: false,
      error: "You do not have permission to close this deployment.",
    };
  }

  // 5. Validate status — can only close ACTIVE or SCHEDULED deployments
  if (
    deployment.status !== DeploymentStatus.ACTIVE &&
    deployment.status !== DeploymentStatus.SCHEDULED
  ) {
    return {
      success: false,
      error: `Cannot close a deployment with status "${deployment.status}".`,
    };
  }

  // 6. Update status to CLOSED
  await prisma.centralDeployment.update({
    where: { id: deploymentId },
    data: { status: DeploymentStatus.CLOSED },
  });

  return { success: true, data: undefined };
}
