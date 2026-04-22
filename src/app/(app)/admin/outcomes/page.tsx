import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractivePlaceholderForm } from "@/components/ui/interactive-placeholder-form";

export default async function AdminOutcomesPage() {
  const programs = await prisma.program.findMany({
    include: {
      _count: {
        select: {
          gos: true,
          plos: true,
        },
      },
    },
    orderBy: { code: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Outcomes Overview</h1>
        <p className="text-sm text-text-secondary">
          Review seeded program outcomes before full CRUD lands in the next pass.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Program Outcome Counts</CardTitle>
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
        title="Outcome Editor Stub"
        description="Prototype outcome capture while keeping persistence deferred."
        submitLabel="Save Outcome Draft"
        fields={[
          { id: "program", kind: "input", label: "Program Code", placeholder: "BSIT" },
          {
            id: "outcome_type",
            kind: "select",
            label: "Outcome Type",
            options: [
              { label: "Program Learning Outcome", value: "PLO" },
              { label: "Graduate Outcome", value: "GO" },
            ],
          },
          { id: "code", kind: "input", label: "Outcome Code", placeholder: "PLO1" },
          { id: "description", kind: "textarea", label: "Description", placeholder: "Describe the target outcome..." },
        ]}
      />
    </div>
  );
}
