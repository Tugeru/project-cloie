import { redirect } from "next/navigation";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import { listFacultyCoursesWithCilos } from "@/features/evaluations/services/list-faculty-courses-with-cilos";
import { AddCiloForm } from "./add-cilo-form";
import { addCilosToCourseAction } from "@/lib/actions/faculty-cilo-actions";

export default async function FacultyAddCiloPage() {
  const session = await resolveAuthSession();

  if (!session) {
    redirect("/login");
  }

  const result = await listFacultyCoursesWithCilos();

  if (!result.success) {
    return (
      <div className="space-y-4">
        <h1 className="text-heading-lg">Add New CILO</h1>
        <p className="text-body-md text-text-secondary">{result.error}</p>
      </div>
    );
  }

  return (
    <AddCiloForm
      courses={JSON.parse(JSON.stringify(result.courses))}
      programs={result.programs}
      addAction={addCilosToCourseAction}
    />
  );
}
