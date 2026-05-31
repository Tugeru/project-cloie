import { redirect } from "next/navigation";
import { listProgramHeadCourses } from "@/features/academic-structure/services/resolve-program-head-courses";
import { listSchoolYears } from "@/features/academic-calendar/services/list-school-years";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { prisma } from "@/lib/db/prisma";
import { ROLES } from "@/lib/constants/roles";
import { CourseAssignmentsClientPage } from "./client-page";
import type { TermInstanceItem } from "@/features/academic-calendar/types";

export const metadata = {
  title: "Course Assignments — Program Head | CLOIE",
};

export default async function CourseAssignmentsPage() {
  const [session, coursesResult, schoolYearsResult] = await Promise.all([
    resolveAuthSession(),
    listProgramHeadCourses(),
    listSchoolYears(),
  ]);

  if (!session || !session.roles.includes(ROLES.PROGRAM_HEAD)) {
    redirect("/unauthorized");
  }

  if (!coursesResult) {
    redirect("/unauthorized");
  }

  // Resolve faculty affiliated with the PH's programs for the filter dropdown
  const programIds = coursesResult.programs.map((p) => p.id);

  const affiliatedFaculty = await prisma.facultyProgramAffiliation.findMany({
    where: { program_id: { in: programIds }, is_active: true },
    select: {
      faculty: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
  });

  const availableFaculty = [
    ...new Map(
      affiliatedFaculty.map(({ faculty: f }) => [
        f.id,
        { id: f.id, firstName: f.first_name, lastName: f.last_name, email: f.email },
      ])
    ).values(),
  ].sort((a, b) => a.lastName.localeCompare(b.lastName));

  const termInstances: TermInstanceItem[] = schoolYearsResult.items.flatMap(
    (sy) => sy.termInstances
  );

  const availableCourses = coursesResult.courses.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
  }));

  return (
    <CourseAssignmentsClientPage
      availableCourses={availableCourses}
      availablePrograms={coursesResult.programs}
      availableFaculty={availableFaculty}
      termInstances={termInstances}
    />
  );
}
