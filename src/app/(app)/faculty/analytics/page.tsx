import { redirect } from "next/navigation";
import { ensureRoleAccess } from "@/features/auth/policies/ensure-role-access";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { listFacultyAnalyticsEvaluations } from "@/features/analytics/services/list-faculty-analytics-evaluations";
import { FacultyAnalyticsDashboard } from "@/features/analytics/components/faculty-analytics-dashboard";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";

export default async function FacultyAnalyticsPage() {
  const session = await resolveAuthSession();

  if (!session) {
    redirect("/login");
  }

  const redirectPath = ensureRoleAccess({
    primaryRole: session.primaryRole,
    roles: session.roles,
    allowedRoles: [ROLES.FACULTY],
  });

  if (redirectPath) {
    redirect(redirectPath);
  }

  // Get initial evaluations list (no filters)
  const evaluationsResult = await listFacultyAnalyticsEvaluations({});

  if (!evaluationsResult.success) {
    return (
      <div className="space-y-4">
        <h1 className="text-heading-lg">Analytics</h1>
        <p className="text-body-md text-text-secondary">{evaluationsResult.error}</p>
      </div>
    );
  }

  // Get available filter options
  const [academicYears, courses] = await Promise.all([
    prisma.courseBoundEvaluation.findMany({
      where: { faculty_id: session.userId },
      select: { academic_year: true },
      distinct: ["academic_year"],
      orderBy: { academic_year: "desc" },
    }),
    prisma.course.findMany({
      where: {
        program_id: {
          in: (
            await prisma.facultyProgramAffiliation.findMany({
              where: { faculty_id: session.userId },
              select: { program_id: true },
            })
          ).map((a) => a.program_id),
        },
      },
      select: {
        id: true,
        code: true,
        title: true,
      },
      orderBy: { code: "asc" },
    }),
  ]);

  const availableAcademicYears = academicYears.map((y) => y.academic_year);
  const availableCourses = courses.map((c) => ({
    id: c.id,
    label: `${c.code} - ${c.title}`,
  }));

  return (
    <FacultyAnalyticsDashboard
      initialEvaluations={evaluationsResult.evaluations}
      availableAcademicYears={availableAcademicYears}
      availableCourses={availableCourses}
    />
  );
}
