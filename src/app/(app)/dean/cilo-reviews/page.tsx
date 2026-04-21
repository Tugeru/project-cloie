import { PublishedCourseBoundList } from "@/components/course-bound-review/published-course-bound-list";
import { listCourseBoundReviewItems } from "@/modules/analytics-reporting-and-review/services/list-course-bound-review-items";

export default async function DeanCiloReviewsPage() {
  const items = await listCourseBoundReviewItems();

  return (
    <PublishedCourseBoundList
      title="College CILO Reviews"
      subtitle="Review course-bound CILO analytics across all programs in your college."
      items={items}
      detailBasePath="/dean/cilo-reviews"
      emptyMessage="No published evaluations with submitted responses are available yet."
    />
  );
}
