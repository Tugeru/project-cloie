import { prisma } from "@/lib/db/prisma";
import { resolveReviewerProgramScope } from "@/modules/academic-catalog-and-context/services/resolve-reviewer-program-scope";
import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";
import type { CourseBoundReviewListItem } from "../types";
import { buildReviewerEvaluationScope, mean, pickReviewerRole } from "./shared";

export async function listCourseBoundReviewItems(): Promise<CourseBoundReviewListItem[]> {
  const authSession = await resolveAuthSession();

  if (!authSession) {
    return [];
  }

  const reviewerRole = pickReviewerRole(authSession.roles);

  if (!reviewerRole) {
    return [];
  }

  const programScope = await resolveReviewerProgramScope({
    reviewerId: authSession.userId,
    reviewerRole,
  });

  if (Array.isArray(programScope) && programScope.length === 0) {
    return [];
  }

  const evaluations = await prisma.courseBoundEvaluation.findMany({
    where: {
      ...buildReviewerEvaluationScope({
        programScope,
        reviewerId: authSession.userId,
        reviewerRole,
      }),
      assignments: {
        some: {
          response: {
            is: {
              status: "SUBMITTED",
            },
          },
        },
      },
    },
    include: {
      assignments: {
        where: {
          response: {
            is: {
              status: "SUBMITTED",
            },
          },
        },
        include: {
          response: {
            include: {
              quant_items: true,
            },
          },
        },
      },
      course: true,
      instrument: {
        include: {
          template: true,
        },
      },
      major: true,
      program: true,
    },
    orderBy: {
      published_at: "desc",
    },
  });

  return evaluations.map((evaluation) => {
    const submittedResponses = evaluation.assignments
      .map((assignment) => assignment.response)
      .filter((response) => Boolean(response));
    const quantRatings = submittedResponses.flatMap((response) =>
      response!.quant_items.map((item) => item.rating_value),
    );

    return {
      academicYear: evaluation.academic_year,
      courseTitle: evaluation.course.title,
      deadlineAt: evaluation.deadline_at,
      evaluationId: evaluation.id,
      evaluationTitle: evaluation.instrument.template.name,
      overallMean: mean(quantRatings),
      programLabel: evaluation.major?.name ?? evaluation.program.name,
      responseCount: submittedResponses.length,
      reviewerRole,
      semester: evaluation.semester,
      term: evaluation.term,
    };
  });
}
