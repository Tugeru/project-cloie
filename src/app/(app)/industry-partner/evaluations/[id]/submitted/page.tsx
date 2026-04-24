import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { getCentralDeploymentEvaluationSession } from "@/features/responses/services/get-central-deployment-evaluation-session";
import { getCentralDeploymentSubmittedReview } from "@/features/responses/services/get-central-deployment-submitted-review";
import { SubmittedResponseReview } from "@/features/responses/components/submitted-response-review";

export default async function IndustryPartnerSubmittedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await resolveAuthSession();

  if (!session) {
    redirect("/login");
  }

  const { id: deploymentId } = await params;

  // Get the session to find the responseId
  const evalSession =
    await getCentralDeploymentEvaluationSession(deploymentId);

  // If no session or no submitted response, redirect back
  if (!evalSession?.session.responseId) {
    redirect(`/industry-partner/evaluations/${deploymentId}`);
  }

  const review = await getCentralDeploymentSubmittedReview(
    evalSession.session.responseId,
  );

  if (!review) {
    notFound();
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/industry-partner/evaluations">
          <ArrowLeft className="mr-2 size-4" /> Back to Evaluations
        </Link>
      </Button>

      <SubmittedResponseReview
        evaluationTitle={review.evaluationTitle}
        courseTitle={review.courseTitle}
        programLabel={review.programLabel}
        submittedAt={review.submittedAt}
        sections={review.sections}
      />
    </div>
  );
}
