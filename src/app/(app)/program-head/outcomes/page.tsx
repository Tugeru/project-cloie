import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractivePlaceholderForm } from "@/components/ui/interactive-placeholder-form";

export default async function ProgramHeadOutcomesPage() {
  const programs = await prisma.program.findMany({
    include: {
      _count: {
        select: { gos: true },
      },
    },
    orderBy: { code: "asc" },
    take: 4,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Program Outcomes</h1>
        <p className="text-sm text-text-secondary">
          Program heads manage Graduate Outcomes and the mapping context used by later
          analytics.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Program Counts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {programs.map((program) => (
            <div key={program.id} className="rounded-xl border border-border px-4 py-3">
              <p className="font-medium">{program.code}</p>
              <p className="text-sm text-text-muted">
                {program._count.gos} GO(s)
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <InteractivePlaceholderForm
        title="Graduate Outcome Stub"
        description="Capture the fields and validation copy for program-head-managed GO editing."
        submitLabel="Save Outcome Draft"
        fields={[
          { id: "program", kind: "input", label: "Program Code", placeholder: "BSIT" },
          { id: "code", kind: "input", label: "Outcome Code", placeholder: "GO2" },
          {
            id: "description",
            kind: "textarea",
            label: "Outcome Description",
            placeholder: "Define the graduate outcome...",
          },
        ]}
      />
    </div>
  );
}
