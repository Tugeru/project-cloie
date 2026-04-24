import { TargetStakeholder } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";

// ─── Public types ───────────────────────────────────────────────────────────

export type StakeholderEvaluationItem = {
  deploymentId: string;
  assignmentId: string;
  evaluationTitle: string;
  programLabel: string;
  deadlineAt: Date | null;
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED";
  responseId: string | null;
  submittedAt: Date | null;
};

export type ListStakeholderEvaluationsResult = {
  active: StakeholderEvaluationItem[];
  submitted: StakeholderEvaluationItem[];
};

// ─── Internal helpers ───────────────────────────────────────────────────────

function buildProgramLabel(input: {
  majorName: string | null;
  programCode: string | null;
  programName: string | null;
  yearLevelName: string | null;
}): string {
  return (
    [
      input.programCode ?? input.programName ?? "Program-wide",
      input.majorName,
      input.yearLevelName,
    ]
      .filter((value): value is string => Boolean(value))
      .join(" • ") || "College-wide"
  );
}

function deriveStatus(response: {
  status: string;
  submitted_at: Date | null;
} | null): "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" {
  if (!response) {
    return "NOT_STARTED";
  }

  if (response.status === "SUBMITTED" || response.submitted_at) {
    return "SUBMITTED";
  }

  return "IN_PROGRESS";
}

// ─── Service ────────────────────────────────────────────────────────────────

/**
 * Lists evaluations assigned to the current user for a given stakeholder type.
 *
 * Used by alumni and industry partner portals to show assigned evaluations
 * sourced from central deployments. Returns items split into active
 * (NOT_STARTED / IN_PROGRESS) and submitted buckets, sorted by deadline.
 */
export async function listStakeholderEvaluations(
  stakeholderType: TargetStakeholder,
): Promise<ListStakeholderEvaluationsResult> {
  const authSession = await resolveAuthSession();

  if (!authSession) {
    return { active: [], submitted: [] };
  }

  const assignments = await prisma.evaluationAssignment.findMany({
    where: {
      respondent_id: authSession.userId,
      central_deployment_id: { not: null },
      central_deployment: {
        target_stakeholder: stakeholderType,
        status: { in: ["ACTIVE", "CLOSED", "SCHEDULED"] },
      },
    },
    include: {
      central_deployment: {
        include: {
          instrument: {
            include: {
              template: true,
            },
          },
          major: true,
          program: true,
          year_level: true,
        },
      },
      response: true,
    },
    orderBy: {
      assigned_at: "desc",
    },
  });

  const items: StakeholderEvaluationItem[] = assignments
    .filter((a) => a.central_deployment !== null)
    .map((assignment) => {
      const deployment = assignment.central_deployment!;
      const status = deriveStatus(assignment.response);

      return {
        deploymentId: deployment.id,
        assignmentId: assignment.id,
        evaluationTitle: deployment.instrument.template.name,
        programLabel: buildProgramLabel({
          majorName: deployment.major?.name ?? null,
          programCode: deployment.program?.code ?? null,
          programName: deployment.program?.name ?? null,
          yearLevelName: deployment.year_level?.name ?? null,
        }),
        deadlineAt: deployment.deadline_at,
        status,
        responseId: assignment.response?.id ?? null,
        submittedAt: assignment.response?.submitted_at ?? null,
      };
    });

  // Sort: active items by deadline ascending (soonest first), submitted by submittedAt descending
  const active = items
    .filter((item) => item.status !== "SUBMITTED")
    .sort((a, b) => {
      if (!a.deadlineAt && !b.deadlineAt) return 0;
      if (!a.deadlineAt) return 1;
      if (!b.deadlineAt) return -1;
      return a.deadlineAt.getTime() - b.deadlineAt.getTime();
    });

  const submitted = items
    .filter((item) => item.status === "SUBMITTED")
    .sort((a, b) => {
      if (!a.submittedAt && !b.submittedAt) return 0;
      if (!a.submittedAt) return 1;
      if (!b.submittedAt) return -1;
      return b.submittedAt.getTime() - a.submittedAt.getTime();
    });

  return { active, submitted };
}
