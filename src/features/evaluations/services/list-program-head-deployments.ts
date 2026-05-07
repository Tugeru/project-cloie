import { ROLES } from "@/lib/constants/roles";
import { getYearLevelDisplay } from "@/lib/constants/year-levels";
import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import type { DeploymentStatus, TargetStakeholder, AcademicSemester } from "@prisma/client";

// ─── Types ───────────────────────────────────────────────────────────────────

type ServiceResult<T = void> = { success: true; data: T } | { success: false; error: string };

export type ProgramHeadDeploymentItem = {
  id: string;
  templateName: string;
  templateId: string;
  programName: string | null;
  programCode: string | null;
  majorName: string | null;
  yearLevelName: string | null;
  target_stakeholder: TargetStakeholder;
  status: DeploymentStatus;
  academic_year: string;
  semester: AcademicSemester;
  activation_at: Date | null;
  deadline_at: Date | null;
  created_at: Date;
  assignmentCount: number;
  responseCount: number;
};

export type ListProgramHeadDeploymentsResult = {
  deployments: ProgramHeadDeploymentItem[];
  program: { id: string; code: string; name: string };
};

// ─── Main Service ────────────────────────────────────────────────────────────

export async function listProgramHeadDeployments(): Promise<
  ServiceResult<ListProgramHeadDeploymentsResult>
> {
  // 1. Authenticate and check role
  const authSession = await resolveAuthSession();

  if (!authSession?.roles?.includes(ROLES.PROGRAM_HEAD)) {
    return {
      success: false,
      error: "Program Head authentication is required.",
    };
  }

  // 2. Resolve PH's program assignment(s)
  const assignments = await prisma.programHeadAssignment.findMany({
    where: {
      program_head_id: authSession.userId,
      is_active: true,
    },
    select: { program_id: true },
  });

  const programIds = [...new Set(assignments.map((a) => a.program_id))];

  if (programIds.length === 0) {
    return {
      success: false,
      error: "No active program assignment found for this Program Head.",
    };
  }

  const primaryProgramId = programIds[0];

  // 3. Resolve program info
  const program = await prisma.program.findUnique({
    where: { id: primaryProgramId },
    select: { id: true, code: true, name: true },
  });

  if (!program) {
    return { success: false, error: "Assigned program not found." };
  }

  // 4. Query CentralDeployment where program_id is in PH's program IDs
  const rawDeployments = await prisma.centralDeployment.findMany({
    where: {
      program_id: { in: programIds },
    },
    include: {
      instrument: {
        include: {
          template: {
            select: { id: true, name: true },
          },
        },
      },
      program: {
        select: { code: true, name: true },
      },
      major: {
        select: { name: true },
      },
      assignments: {
        select: {
          id: true,
          response: {
            select: {
              status: true,
            },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  // 5. Map to typed result with counts
  const deployments: ProgramHeadDeploymentItem[] = rawDeployments.map((d) => ({
    id: d.id,
    templateName: d.deployment_name ?? d.instrument.template.name,
    templateId: d.instrument.template.id,
    programName: d.program?.name ?? null,
    programCode: d.program?.code ?? null,
    majorName: d.major?.name ?? null,
    yearLevelName: d.year_level ? getYearLevelDisplay(d.year_level) : null,
    target_stakeholder: d.target_stakeholder,
    status: d.status,
    academic_year: d.academic_year,
    semester: d.semester,
    activation_at: d.activation_at,
    deadline_at: d.deadline_at,
    created_at: d.created_at,
    assignmentCount: d.assignments.length,
    responseCount: d.assignments.filter((a) => a.response?.status === "SUBMITTED").length,
  }));

  return { success: true, data: { deployments, program } };
}
