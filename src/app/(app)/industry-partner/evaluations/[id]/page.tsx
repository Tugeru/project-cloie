import { TargetStakeholder } from "@prisma/client";
import { notFound } from "next/navigation";
import { InteractivePlaceholderForm } from "@/components/ui/interactive-placeholder-form";
import { prisma } from "@/lib/db/prisma";

export default async function IndustryPartnerEvaluationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deployment = await prisma.centralDeployment.findFirst({
    where: {
      id,
      target_stakeholder: TargetStakeholder.INDUSTRY_PARTNER,
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
          {deployment.program?.name ?? "College-wide"} - Scaffolded authenticated industry
          response flow
        </p>
      </div>

      <InteractivePlaceholderForm
        title="Industry Response Stub"
        description="This page prepares the authenticated industry partner portal surface for later live submissions."
        submitLabel="Save Industry Draft"
        fields={[
          { id: "company", kind: "input", label: "Company", placeholder: "ACD Partner Company" },
          {
            id: "readiness",
            kind: "textarea",
            label: "Readiness Assessment",
            placeholder: "Describe knowledge, skills, and professionalism observations...",
          },
          {
            id: "recommendation",
            kind: "textarea",
            label: "Recommendation",
            placeholder: "Would you recommend this graduate or intern? Why?",
          },
        ]}
      />
    </div>
  );
}
