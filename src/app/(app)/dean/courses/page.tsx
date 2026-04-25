import { listAdminCoursesSummary } from "@/features/academic-structure/services/list-admin-courses-summary";
import { AdminCoursesList } from "@/features/academic-structure/components/admin-courses-list";

export default async function DeanCoursesPage() {
  const { courses, kpi, programs } = await listAdminCoursesSummary();

  return (
    <AdminCoursesList
      courses={courses}
      kpi={kpi}
      programs={programs}
      basePath="/dean/courses"
    />
  );
}
