import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import type { FacultyEvaluationDetail, GetFacultyEvaluationDetailResult } from "../types";

export async function getFacultyEvaluationDetail(
  evaluationId: string
): Promise<GetFacultyEvaluationDetailResult> {
  const session = await resolveAuthSession();

  if (!session || !session.roles.includes(ROLES.FACULTY)) {
    return { success: false, error: "Unauthorized. Faculty role required." };
  }

  const evaluation = await prisma.courseBoundEvaluation.findFirst({
    where: {
      id: evaluationId,
      faculty_id: session.userId,
    },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          title: true,
          course_scope: true,
        },
      },
      program: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      major: {
        select: {
          id: true,
          name: true,
        },
      },
      targets: {
        include: {
          program: {
            select: {
              id: true,
              code: true,
            },
          },
        },
      },
      cilo_question_bindings: {
        select: {
          cilo_id: true,
          cilo_description_snapshot: true,
          section_key: true,
          item_key: true,
          question_prompt_snapshot: true,
        },
      },
      _count: {
        select: {
          assignments: true,
        },
      },
      term_instance: {
        include: {
          school_year: true,
        },
      },
      assignments: {
        where: {
          response: {
            status: "SUBMITTED",
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!evaluation) {
    return {
      success: false,
      error: "Evaluation not found or you do not have access.",
    };
  }

  const courseInfoSnapshot = evaluation.course_info_snapshot as {
    courseCode?: string;
    courseTitle?: string;
    courseScope?: string;
    majorName?: string | null;
    programCode?: string;
    programName?: string;
  } | null;

  const cilosSnapshot = evaluation.cilos_snapshot as Array<{
    description: string;
    id: string;
    label: string;
  }> | null;

  const ti = evaluation.term_instance;
  const termLabel = ti.term ? `${ti.term}` : "";
  const termInstanceLabel = termLabel
    ? `${ti.school_year.code} — ${ti.semester} — ${termLabel}`
    : `${ti.school_year.code} — ${ti.semester}`;

  const detail: FacultyEvaluationDetail = {
    termInstanceLabel,
    activationAt: evaluation.activation_at,
    cilos:
      cilosSnapshot?.map((cilo) => ({
        description: cilo.description,
        id: cilo.id,
        label: cilo.label,
      })) ?? [],
    courseInfo: {
      courseCode: courseInfoSnapshot?.courseCode ?? evaluation.course.code,
      courseScope:
        courseInfoSnapshot?.courseScope ??
        evaluation.course.course_scope.replace(/_/g, " ").toLowerCase(),
      courseTitle: courseInfoSnapshot?.courseTitle ?? evaluation.course.title,
      majorName: courseInfoSnapshot?.majorName ?? evaluation.major?.name ?? null,
      programCode: courseInfoSnapshot?.programCode ?? evaluation.program.code,
      programName: courseInfoSnapshot?.programName ?? evaluation.program.name,
    },
    deadlineAt: evaluation.deadline_at,
    deploymentName: evaluation.deployment_name,
    evaluationId: evaluation.id,
    publishedAt: evaluation.published_at,
    responseCount: evaluation.assignments.length,
    status: evaluation.status,
    targets: evaluation.targets.map((target) => ({
      programCode: target.program.code,
      programId: target.program.id,
      yearLevel: target.year_level,
    })),
    templateBindings: evaluation.cilo_question_bindings.map((binding) => ({
      ciloDescriptionSnapshot: binding.cilo_description_snapshot,
      ciloId: binding.cilo_id,
      itemKey: binding.item_key,
      questionPromptSnapshot: binding.question_prompt_snapshot,
      sectionKey: binding.section_key,
    })),
    totalAssignments: evaluation._count.assignments,
  };

  return {
    success: true,
    data: detail,
  };
}
