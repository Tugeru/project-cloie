import { prisma } from "@/lib/db/prisma";
import { resolveReviewerProgramScope } from "@/features/academic-structure/services/resolve-reviewer-program-scope";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import type { CourseBoundResponseReview } from "../types";
import { getSnapshotSectionItems, isSnapshotSection } from "./snapshot-structure";
import {
  buildAnonymizedRespondentLabel,
  buildReviewerEvaluationScope,
  mean,
  pickReviewerRole,
} from "./shared";

export async function getCourseBoundResponseReview(
  responseId: string,
): Promise<CourseBoundResponseReview | null> {
  const authSession = await resolveAuthSession();

  if (!authSession) {
    return null;
  }

  const reviewerRole = pickReviewerRole(authSession.roles);

  if (!reviewerRole) {
    return null;
  }

  const programScope = await resolveReviewerProgramScope({
    reviewerId: authSession.userId,
    reviewerRole,
  });

  if (Array.isArray(programScope) && programScope.length === 0) {
    return null;
  }

  const response = await prisma.response.findFirst({
    where: {
      id: responseId,
      status: "SUBMITTED",
      assignment: {
        is: {
          course_bound: {
            is: {
              ...buildReviewerEvaluationScope({
                programScope,
                reviewerId: authSession.userId,
                reviewerRole,
              }),
            },
          },
        },
      },
    },
    include: {
      assignment: {
        include: {
          course_bound: {
            include: {
              course: true,
              instrument: {
                include: {
                  template: true,
                },
              },
              major: true,
              program: true,
            },
          },
        },
      },
      qual_items: true,
      quant_items: true,
    },
  });

  if (!response?.assignment.course_bound || !response.submitted_at) {
    return null;
  }

  const evaluation = response.assignment.course_bound;
  const sections = (Array.isArray(evaluation.instrument.structure_snapshot)
    ? evaluation.instrument.structure_snapshot
    : []
  )
    .filter(isSnapshotSection)
    .map((section) => {
      const items = getSnapshotSectionItems(section);
      const quantitativeItems = items.filter((item) => item.kind === "quantitative");
      const qualitativeItems = items.filter((item) => item.kind === "qualitative");

      const quantitativeResponses = quantitativeItems
        .map((item) => {
          const entry = response.quant_items.find(
            (candidate) =>
              candidate.section_key === section.key &&
              candidate.item_key === item.key,
          );

          if (!entry) {
            return null;
          }

          return {
            itemKey: item.key,
            prompt: item.prompt,
            rating: entry.rating_value,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

      const qualitativeResponses = qualitativeItems
        .map((item) => {
          const entry = response.qual_items.find(
            (candidate) =>
              candidate.section_key === section.key &&
              candidate.prompt_key === item.key,
          );

          if (!entry || entry.text_content.trim().length === 0) {
            return null;
          }

          return {
            prompt: item.prompt,
            promptKey: item.key,
            text: entry.text_content,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

      return {
        id: section.key,
        mean: mean(quantitativeResponses.map((item) => item.rating)),
        name: section.title,
        qualitativeResponses,
        quantitativeResponses,
      };
    });

  return {
    academicYear: evaluation.academic_year,
    courseTitle: evaluation.course.title,
    evaluationId: evaluation.id,
    evaluationTitle: evaluation.deployment_name ?? evaluation.instrument.template.name,
    overallMean: mean(response.quant_items.map((item) => item.rating_value)),
    programLabel: evaluation.major?.name ?? evaluation.program.name,
    responseId: response.id,
    respondentLabel: buildAnonymizedRespondentLabel(response.id),
    reviewerRole,
    sections,
    submittedAt: response.submitted_at,
  };
}
