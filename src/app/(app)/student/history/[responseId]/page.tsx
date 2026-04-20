import { SubmittedResponseReview } from "@/components/student/evaluations/submitted-response-review";
import { getStudentSubmittedResponseReview } from "@/modules/student-evaluation-workflow/services/get-student-submitted-response-review";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function StudentSubmittedResponseReviewPage({
  params,
}: {
  params: Promise<{ responseId: string }>;
}) {
  const { responseId } = await params;
  const review = await getStudentSubmittedResponseReview(responseId);

  if (!review) {
    notFound();
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/student/history">
            <ArrowLeft className="mr-2 size-4" /> Back to History
          </Link>
        </Button>
      </div>

      <SubmittedResponseReview
        evaluationTitle={review.evaluationTitle}
        courseTitle={review.courseTitle}
        submittedAt={review.submittedAt}
        sections={review.sections}
      />
    </div>
  );
}