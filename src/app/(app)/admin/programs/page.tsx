import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractivePlaceholderForm } from "@/components/ui/interactive-placeholder-form";

export default async function AdminProgramsPage() {
  const programs = await prisma.program.findMany({
    include: {
      majors: {
        where: { is_active: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { code: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Programs and Majors</h1>
        <p className="text-sm text-text-secondary">
          Programs remain fully data-driven. Current ACD offerings are seeded, not hardcoded in business logic.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalog Snapshot</CardTitle>
          <CardDescription>Normalized programs can stand alone or contain multiple majors.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {programs.map((program) => (
            <div key={program.id} className="rounded-xl border border-border px-4 py-3">
              <p className="font-medium">{program.code} - {program.name}</p>
              <p className="mt-1 text-sm text-text-muted">
                {program.majors.length > 0
                  ? program.majors.map((major) => major.name).join(", ")
                  : "No majors configured"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <InteractivePlaceholderForm
        title="Program Editor Stub"
        description="Prototype the eventual create or edit flow for programs and majors."
        submitLabel="Save Program Draft"
        fields={[
          { id: "code", kind: "input", label: "Program Code", placeholder: "BSIT" },
          { id: "name", kind: "input", label: "Program Name", placeholder: "Bachelor of Science in Information Technology" },
          { id: "description", kind: "textarea", label: "Description", placeholder: "Program summary and accreditation notes..." },
          { id: "majors", kind: "textarea", label: "Majors", placeholder: "One major per line for normalized programs" },
        ]}
      />
    </div>
  );
}
