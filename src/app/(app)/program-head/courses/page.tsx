import { redirect } from "next/navigation";
import { listProgramHeadCourses } from "@/features/academic-structure/services/resolve-program-head-courses";
import { ProgramHeadCoursesCatalog } from "@/features/academic-structure/components/program-head-courses-catalog";

export const metadata = {
  title: "Courses — Program Head | CLOIE",
};

export default async function ProgramHeadCoursesPage() {
  const result = await listProgramHeadCourses();

  if (!result) {
    redirect("/unauthorized");
  }

  return (
    <ProgramHeadCoursesCatalog
      courses={result.courses}
      summary={result.summary}
      programs={result.programs}
      majors={result.majors}
    />
  );
}
