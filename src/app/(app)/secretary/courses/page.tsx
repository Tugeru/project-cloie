import { listManagementCoursesSummary } from "@/features/academic-structure/services/list-management-courses-summary";
import { ManagementCoursesList } from "@/features/academic-structure/components/management-courses-list";

export default async function SecretaryCoursesPage() {
  const { courses, kpi, programs } = await listManagementCoursesSummary();

  return <ManagementCoursesList courses={courses} kpi={kpi} programs={programs} />;
}
