import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseBoundReviewTabs } from "@/components/course-bound-review/course-bound-review-tabs";
import { getCourseBoundReviewDetail } from "@/modules/analytics-reporting-and-review/services/get-course-bound-review-detail";

export default async function FacultyCiloEvaluationDetailPage({
  params,
}: {
  params: Promise<{ evaluationId: string }>;
}) {
  const { evaluationId } = await params;
  const detail = await getCourseBoundReviewDetail(evaluationId);

  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/faculty/cilo-evaluations">
          <ArrowLeft className="mr-2 size-4" /> Back to CILO Evaluations
        </Link>
      </Button>

      <section className="space-y-1">
        <h1 className="text-2xl font-bold">{detail.evaluationTitle}</h1>
        <p className="text-sm text-text-muted">
          {detail.courseTitle} | {detail.programLabel} | {detail.academicYear} {detail.semester} {detail.term}
        </p>
      </section>

      <CourseBoundReviewTabs detail={detail} responseBasePath={`/faculty/cilo-evaluations/${detail.evaluationId}`} />
    </div>
  );
}
