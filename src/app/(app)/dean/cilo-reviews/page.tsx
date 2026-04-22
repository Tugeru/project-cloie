import { PublishedCourseBoundList } from "@/features/analytics/components/published-course-bound-list";
import { listCourseBoundReviewItems } from "@/features/analytics/services/list-course-bound-review-items";

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
