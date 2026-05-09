import { redirect } from "next/navigation";
import { listProgramHeadCourses } from "@/features/academic-structure/services/resolve-program-head-courses";
import { listSchoolYears } from "@/features/academic-calendar/services/list-school-years";
import { ProgramHeadCoursesCatalog } from "@/features/academic-structure/components/program-head-courses-catalog";
import type { TermInstanceItem } from "@/features/academic-calendar/types";

export const metadata = {
  title: "Courses — Program Head | CLOIE",
};

export default async function ProgramHeadCoursesPage() {
  const [coursesResult, schoolYearsResult] = await Promise.all([
    listProgramHeadCourses(),
    listSchoolYears(),
  ]);

  if (!coursesResult) {
    redirect("/unauthorized");
  }

  // Flatten term instances from all school years
  const termInstances: TermInstanceItem[] = schoolYearsResult.items.flatMap(
    (sy) => sy.termInstances
  );

  return (
    <ProgramHeadCoursesCatalog
      courses={coursesResult.courses}
      summary={coursesResult.summary}
      programs={coursesResult.programs}
      majors={coursesResult.majors}
      termInstances={termInstances}
    />
  );
}
