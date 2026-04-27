import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractivePlaceholderForm } from "@/components/ui/interactive-placeholder-form";

export default async function AdminOutcomesPage() {
  const programs = await prisma.program.findMany({
    include: {
      _count: {
        select: {
          gos: true,
        },
      },
    },
    orderBy: { code: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Graduate Outcomes</h1>
        <p className="text-text-secondary text-sm">
          The MVP outcome model now centers on Graduate Outcomes and CILO-to-GO mapping.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Program Outcome Counts</CardTitle>
          <CardDescription>
            Graduate Outcomes are stored by program and later connected to course CILOs.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {programs.map((program) => (
            <div key={program.id} className="border-border rounded-xl border px-4 py-3">
              <p className="font-medium">{program.code}</p>
              <p className="text-text-muted text-sm">{program._count.gos} GO(s)</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <InteractivePlaceholderForm
        title="Graduate Outcome Editor Stub"
        description="Prototype GO capture while the full CRUD and mapping matrix are wired."
        submitLabel="Save Outcome Draft"
        fields={[
          { id: "program", kind: "input", label: "Program Code", placeholder: "BSIT" },
          { id: "code", kind: "input", label: "Outcome Code", placeholder: "GO1" },
          {
            id: "description",
            kind: "textarea",
            label: "Description",
            placeholder: "Describe the graduate outcome...",
          },
        ]}
      />
    </div>
  );
}
