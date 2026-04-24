import { listPrograms } from "@/features/academic-structure/services/manage-programs";
import { createProgramAction } from "@/lib/actions/admin-program-actions";
import { ProgramForm } from "@/features/academic-structure/components/program-form";
import { ProgramList } from "@/features/academic-structure/components/program-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminProgramsPage() {
  const programs = await listPrograms();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading-lg">Programs and Majors</h1>
        <p className="text-body-md text-text-secondary">
          Manage academic programs and their majors. Programs can be activated or deactivated.
          Majors can be added inline to each program.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Program</CardTitle>
          <CardDescription>
            Add a new academic program to the college. You can add majors after creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgramForm action={createProgramAction} submitLabel="Create Program" />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-heading-md">
          All Programs ({programs.length})
        </h2>
        {programs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-text-muted">
                No programs found. Create your first program above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ProgramList programs={programs} />
        )}
      </div>
    </div>
  );
}
