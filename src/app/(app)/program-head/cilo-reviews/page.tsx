import { PublishedCourseBoundList } from "@/components/course-bound-review/published-course-bound-list";
import { listCourseBoundReviewItems } from "@/modules/analytics-reporting-and-review/services/list-course-bound-review-items";

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
