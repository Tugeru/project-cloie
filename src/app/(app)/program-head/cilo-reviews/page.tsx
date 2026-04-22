import { PublishedCourseBoundList } from "@/features/analytics/components/published-course-bound-list";
import { listCourseBoundReviewItems } from "@/features/analytics/services/list-course-bound-review-items";

export default async function ProgramHeadCiloReviewsPage() {
  const items = await listCourseBoundReviewItems();

  return (
    <PublishedCourseBoundList
      title="Program CILO Reviews"
      subtitle="Review course-bound CILO evaluation analytics for your assigned programs."
      items={items}
      detailBasePath="/program-head/cilo-reviews"
      emptyMessage="No published evaluations with submitted responses are available for your program scope."
    />
  );
}
