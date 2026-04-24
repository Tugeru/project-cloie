import { CourseManagement } from "@/features/academic-structure/components/course-management";
import { listCourses } from "@/features/academic-structure/services/manage-courses";
import { prisma } from "@/lib/db/prisma";

export default async function AdminCoursesPage() {
  const [courses, programs] = await Promise.all([
    listCourses(),
    prisma.program.findMany({
      where: { is_active: true },
      include: {
        majors: {
          where: { is_active: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { code: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Courses</h1>
        <p className="text-sm text-text-secondary">
          Manage the shared course catalog for general education, program-wide, and
          major-specific contexts.
        </p>
      </div>

      <CourseManagement courses={courses} programs={programs} />
    </div>
  );
}
