import { redirect } from "next/navigation";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { listFacultyCoursesWithCilos } from "@/features/evaluations/services/list-faculty-courses-with-cilos";
import { FacultyCilosCourseList } from "@/features/evaluations/components/faculty-cilos-course-list";
import {
  loadCilosForCourseAction,
  saveCilosForCourseAction,
} from "@/lib/actions/faculty-cilo-actions";

export default async function FacultyCilosPage() {
  const session = await resolveAuthSession();

  if (!session) {
    redirect("/login");
  }

  const result = await listFacultyCoursesWithCilos();

  if (!result.success) {
    return (
      <div className="space-y-4">
        <h1 className="text-heading-lg">Manage CILOs</h1>
        <p className="text-body-md text-text-secondary">{result.error}</p>
      </div>
    );
  }

  return (
    <FacultyCilosCourseList
      courses={JSON.parse(JSON.stringify(result.courses))}
      loadCilosAction={loadCilosForCourseAction}
      saveCilosAction={saveCilosForCourseAction}
    />
  );
}
