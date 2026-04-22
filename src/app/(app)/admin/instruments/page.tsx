import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractivePlaceholderForm } from "@/components/ui/interactive-placeholder-form";

export default async function AdminInstrumentsPage() {
  const templates = await prisma.instrumentTemplate.findMany({
    include: {
      versions: {
        orderBy: { version_number: "desc" },
        take: 1,
      },
    },
    orderBy: { code: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Instruments</h1>
        <p className="text-sm text-text-secondary">
          Institutional baseline instruments stay governed centrally, with program-head tooling layered on top.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Baseline Templates</CardTitle>
          <CardDescription>Current templates and their latest visible versions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="rounded-xl border border-border px-4 py-3">
              <p className="font-medium">{template.code} - {template.name}</p>
              <p className="text-sm text-text-muted">
                Latest version: {template.versions[0]?.version_number ?? "N/A"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <InteractivePlaceholderForm
        title="Instrument Governance Stub"
        description="Prototype create and edit flows for baseline instrument metadata."
        submitLabel="Save Template Draft"
        fields={[
          { id: "code", kind: "input", label: "Template Code", placeholder: "EXIT_SURVEY" },
          { id: "title", kind: "input", label: "Title", placeholder: "Graduating Student Exit Survey" },
          { id: "description", kind: "textarea", label: "Description", placeholder: "Explain the purpose and scope..." },
          { id: "version_note", kind: "textarea", label: "Version Note", placeholder: "What changed in this draft?" },
        ]}
      />
    </div>
  );
}
