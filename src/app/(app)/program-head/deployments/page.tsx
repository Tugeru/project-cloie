import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractivePlaceholderForm } from "@/components/ui/interactive-placeholder-form";
import { SEMESTER_OPTIONS } from "@/lib/constants/academic";

export default async function ProgramHeadDeploymentsPage() {
  const deployments = await prisma.centralDeployment.findMany({
    include: {
      instrument: {
        include: {
          template: true,
        },
      },
      program: true,
    },
    orderBy: { created_at: "desc" },
    take: 8,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Deployments</h1>
        <p className="text-sm text-text-secondary">
          Central stakeholder deployments are scaffolded here for graduating students, alumni, and industry partners.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Deployments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {deployments.map((deployment) => (
            <div key={deployment.id} className="rounded-xl border border-border px-4 py-3">
              <p className="font-medium">{deployment.instrument.template.name}</p>
              <p className="text-sm text-text-muted">
                {deployment.target_stakeholder} • {deployment.program?.code ?? "College-wide"} • {deployment.academic_year}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <InteractivePlaceholderForm
        title="Deployment Planner Stub"
        description="Validate targeting inputs before wiring the actual deployment mutations."
        submitLabel="Save Deployment Draft"
        fields={[
          { id: "tool", kind: "input", label: "Template Code", placeholder: "ALUMNI_EVAL" },
          { id: "program", kind: "input", label: "Program Context", placeholder: "BSIT or leave blank for college-wide" },
          {
            id: "semester",
            kind: "select",
            label: "Semester",
            options: SEMESTER_OPTIONS.map((option) => ({ label: option.label, value: option.value })),
          },
          { id: "notes", kind: "textarea", label: "Deployment Notes", placeholder: "Audience rules, invite assumptions, deadline notes..." },
        ]}
      />
    </div>
  );
}
