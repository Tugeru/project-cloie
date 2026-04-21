import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnonymizedResponseDetail } from "@/components/course-bound-review/anonymized-response-detail";
import { getCourseBoundResponseReview } from "@/modules/analytics-reporting-and-review/services/get-course-bound-response-review";

export default async function ProgramHeadCiloResponsePage({
  params,
}: {
  params: Promise<{ evaluationId: string; responseId: string }>;
}) {
  const { evaluationId, responseId } = await params;
  const response = await getCourseBoundResponseReview(responseId);

  if (!response || response.evaluationId !== evaluationId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/program-head/cilo-reviews/${evaluationId}`}>
          <ArrowLeft className="mr-2 size-4" /> Back to Evaluation
        </Link>
      </Button>

      <AnonymizedResponseDetail response={response} />
    </div>
  );
}
