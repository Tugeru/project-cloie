import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import type {
  StudentEvaluationListItem,
  StudentEvaluationListStatus,
  StudentEvaluationSection,
  StudentEvaluationSession,
} from "@/features/responses/types";
import { isCourseBoundEvaluationAvailable } from "./course-bound-availability";
import { mapStructureSnapshotToSections } from "./get-student-course-bound-evaluation-session";

const THREE_DAYS_IN_MS = 3 * 24 * 60 * 60 * 1000;

type DeriveStudentEvaluationStatusInput = StudentEvaluationSession & {
  deadlineAt: Date | null;
  now?: Date;
};

type BuildStudentEvaluationListItemInput = {
  assignmentId: string;
  evaluationId: string;
  evaluationTitle: string;
  courseTitle: string;
  programLabel: string;
  deadlineAt: Date | null;
  href: string | null;
  section: StudentEvaluationSection;
  session: StudentEvaluationSession;
  now?: Date;
};

function clampProgress(progress: number) {
  return Math.min(100, Math.max(0, progress));
}

export function deriveStudentEvaluationStatus({
  answeredItems,
  deadlineAt,
  now = new Date(),
  responseId,
  submittedAt,
  totalItems,
}: DeriveStudentEvaluationStatusInput): {
  progress: number;
  status: StudentEvaluationListStatus;
} {
  const progress = totalItems > 0 ? clampProgress(Math.round((answeredItems / totalItems) * 100)) : 0;

  if (submittedAt) {
    return { progress, status: "SUBMITTED" };
  }

  if (!responseId) {
    const timeUntilDeadline = deadlineAt ? deadlineAt.getTime() - now.getTime() : null;

    if (timeUntilDeadline !== null && timeUntilDeadline >= 0 && timeUntilDeadline <= THREE_DAYS_IN_MS) {
      return { progress: 0, status: "DUE_SOON" };
    }

    return { progress: 0, status: "NOT_STARTED" };
  }

  return { progress, status: "IN_PROGRESS" };
}

export function buildStudentEvaluationListItem({
  assignmentId,
  courseTitle,
  deadlineAt,
  evaluationId,
  evaluationTitle,
  href,
  now,
  programLabel,
  section,
  session,
}: BuildStudentEvaluationListItemInput): StudentEvaluationListItem {
  const { progress, status } = deriveStudentEvaluationStatus({
    answeredItems: session.answeredItems,
    deadlineAt,
    now,
    responseId: session.responseId,
    submittedAt: session.submittedAt,
    totalItems: session.totalItems,
  });

  return {
    assignmentId,
    courseTitle,
    deadlineAt,
    deploymentType: "COURSE_BOUND",
    evaluationId,
    evaluationTitle,
    href,
    progress,
    programLabel,
    section,
    session,
    status,
  };
}

function countSectionItems(sections: StudentEvaluationSection[]) {
  return sections.reduce((total, section) => total + section.items.length, 0);
}

function buildFallbackSection(): StudentEvaluationSection {
  return {
    description: "",
    id: "overview",
    items: [],
    name: "Overview",
  };
}

export async function listStudentCourseBoundEvaluations(): Promise<{
  active: StudentEvaluationListItem[];
  submitted: StudentEvaluationListItem[];
}> {
  const authSession = await resolveAuthSession();

  if (!authSession) {
    return { active: [], submitted: [] };
  }

  const assignments = await prisma.evaluationAssignment.findMany({
    where: {
      course_bound_id: { not: null },
      respondent_id: authSession.userId,
    },
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
      response: {
        include: {
          qual_items: true,
          quant_items: true,
        },
      },
    },
    orderBy: {
      assigned_at: "desc",
    },
  });

  const now = new Date();

  const items = assignments
    .filter((assignment) => assignment.course_bound)
    .flatMap((assignment) => {
      const courseBound = assignment.course_bound!;
      const response = assignment.response ?? null;

      if (
        !response?.submitted_at &&
        !isCourseBoundEvaluationAvailable(courseBound, now)
      ) {
        return [];
      }

      const sections = mapStructureSnapshotToSections(courseBound.instrument.structure_snapshot);
      const section = sections[0] ?? buildFallbackSection();
      const session: StudentEvaluationSession = {
        answeredItems: response ? response.qual_items.length + response.quant_items.length : 0,
        responseId: response?.id ?? null,
        submittedAt: response?.submitted_at ?? null,
        totalItems: countSectionItems(sections),
      };
      const status = deriveStudentEvaluationStatus({
        answeredItems: session.answeredItems,
        deadlineAt: courseBound.deadline_at,
        responseId: session.responseId,
        submittedAt: session.submittedAt,
        totalItems: session.totalItems,
      }).status;
      const href = status === "SUBMITTED"
        ? session.responseId
          ? `/student/history/${session.responseId}`
          : null
        : `/student/evaluations/${assignment.id}`;

      return buildStudentEvaluationListItem({
        assignmentId: assignment.id,
        courseTitle: courseBound.course.title,
        deadlineAt: courseBound.deadline_at,
        evaluationId: assignment.id,
        evaluationTitle: courseBound.instrument.template.name,
        href,
        now,
        programLabel: courseBound.major?.name ?? courseBound.program.name,
        section,
        session,
      });
    });

  return {
    active: items.filter((item) => item.status !== "SUBMITTED"),
    submitted: items.filter((item) => item.status === "SUBMITTED"),
  };
}
