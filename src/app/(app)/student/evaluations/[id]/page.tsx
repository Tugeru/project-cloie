import { ErrorBoundary } from "@/components/error-boundary";
import { WizardShell } from "@/features/responses/components/wizard-shell";
import { getStudentAssignedEvaluationSession } from "@/features/responses/services/get-student-assigned-evaluation-session";
import {
  saveStudentEvaluationDraftAction,
  submitStudentEvaluationResponseAction,
} from "@/lib/actions/student-evaluation-actions";
import { notFound, redirect } from "next/navigation";

export default async function EvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getStudentAssignedEvaluationSession(id);

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
    <ErrorBoundary>
      <WizardShell
        assignmentId={session.assignmentId}
        title={session.evaluationTitle}
        courseTitle={session.courseTitle ?? session.programLabel}
        sections={session.sections}
        initialAnswers={session.savedAnswers}
        onSaveDraft={saveStudentEvaluationDraftAction}
        onSubmitResponse={submitStudentEvaluationResponseAction}
      />
    </ErrorBoundary>
  );
}
