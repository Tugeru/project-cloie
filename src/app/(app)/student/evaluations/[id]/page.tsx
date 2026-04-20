import { WizardShell } from "@/components/student/evaluations/wizard-shell";
import { getStudentCourseBoundEvaluationSession } from "@/modules/student-evaluation-workflow/services/get-student-course-bound-evaluation-session";
import { saveStudentCourseBoundDraftAction, submitStudentCourseBoundResponseAction } from "@/lib/actions/student-evaluation-actions";
import { notFound, redirect } from "next/navigation";

export default async function EvaluationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getStudentCourseBoundEvaluationSession(id);

  if (!session) {
    notFound();
  }

  if (session.session.submittedAt) {
    if (!session.session.responseId) {
      notFound();
    }

    redirect(`/student/history/${session.session.responseId}`);
  }

  return (
    <WizardShell
      assignmentId={session.assignmentId}
      title={session.evaluationTitle}
      courseTitle={session.courseTitle}
      sections={session.sections}
      initialAnswers={session.savedAnswers}
      onSaveDraft={saveStudentCourseBoundDraftAction}
      onSubmitResponse={submitStudentCourseBoundResponseAction}
    />
  );
}
