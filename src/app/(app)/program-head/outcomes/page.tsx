import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractivePlaceholderForm } from "@/components/ui/interactive-placeholder-form";

export default async function ProgramHeadOutcomesPage() {
  const programs = await prisma.program.findMany({
    include: {
      _count: {
        select: { gos: true, plos: true },
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
          Scaffolded program-head editing flow for PLOs, GOs, and stakeholder-facing summaries.
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
                {program._count.plos} PLO(s) • {program._count.gos} GO(s)
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <InteractivePlaceholderForm
        title="Program Outcome Stub"
        description="Capture the fields and validation copy for program-head-managed outcome editing."
        submitLabel="Save Outcome Draft"
        fields={[
          { id: "program", kind: "input", label: "Program Code", placeholder: "BSIT" },
          { id: "code", kind: "input", label: "Outcome Code", placeholder: "PLO2" },
          { id: "description", kind: "textarea", label: "Outcome Description", placeholder: "Define the program-level outcome..." },
        ]}
      />
    </div>
  );
}
