import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { InteractivePlaceholderForm } from "@/components/ui/interactive-placeholder-form";

export default async function AlumniEvaluationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deployment = await prisma.centralDeployment.findFirst({
    where: {
      id,
      target_stakeholder: "ALUMNI",
    },
    include: {
      instrument: { include: { template: true } },
      program: true,
    },
  });

  if (!deployment) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{deployment.instrument.template.name}</h1>
        <p className="text-sm text-text-secondary">
          {deployment.program?.name ?? "College-wide"} • Scaffolded authenticated alumni response flow
        </p>
      </div>

      <InteractivePlaceholderForm
        title="Alumni Response Stub"
        description="This page prepares the authenticated alumni portal surface for future live response submission."
        submitLabel="Save Alumni Draft"
        fields={[
          { id: "employment", kind: "input", label: "Current Role", placeholder: "Systems Analyst" },
          { id: "readiness", kind: "textarea", label: "Readiness Feedback", placeholder: "Describe how the program supported workplace readiness..." },
          { id: "recommendation", kind: "textarea", label: "Recommendation", placeholder: "What should the program improve?" },
        ]}
      />
    </div>
  );
}
