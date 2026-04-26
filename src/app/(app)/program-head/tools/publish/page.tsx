import { redirect } from "next/navigation";
import Link from "next/link";
import { listProgramHeadTemplates } from "@/features/instruments/services/manage-program-head-templates";
import { PublishCentralDeploymentForm } from "@/features/evaluations/components/publish-central-deployment-form";
import { publishCentralDeploymentAction } from "@/lib/actions/central-deployment-actions";
import { prisma } from "@/lib/db/prisma";

export const metadata = {
  title: "Publish Evaluation Tool — Program Head | CLOIE",
};

interface PageProps {
  searchParams: Promise<{ templateId?: string }>;
}

export default async function ProgramHeadPublishToolPage({ searchParams }: PageProps) {
  const { templateId } = await searchParams;

  // 1. Get PH templates (also validates PH auth + scope)
  const templatesResult = await listProgramHeadTemplates();

  if (!templatesResult.success) {
    redirect("/unauthorized");
  }

  const { templates: allTemplates, program } = templatesResult.data;

  // Filter to active templates only
  const activeTemplates = allTemplates
    .filter((t) => t.is_active && t.template_type === "PROGRAM_WIDE")
    .map((t) => ({ id: t.id, name: t.name, code: t.code }));

  // 2. Load year levels
  const yearLevels = await prisma.yearLevel.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  // 3. Load majors for PH's program
  const majors = await prisma.major.findMany({
    where: { program_id: program.id, is_active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // 4. Validate pre-selected template
  const preselectedTemplateId =
    templateId && activeTemplates.some((t) => t.id === templateId) ? templateId : undefined;

  return (
    <div className="space-y-4">
      <Link
        href="/program-head/tools"
        className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Evaluation Tools
      </Link>

      <nav className="text-text-secondary text-xs">
        <span>Templates</span>
        <span className="mx-1">›</span>
        {preselectedTemplateId && (
          <>
            <span>
              {activeTemplates.find((t) => t.id === preselectedTemplateId)?.name ?? "Template"}
            </span>
            <span className="mx-1">›</span>
          </>
        )}
        <span className="text-text-primary font-medium">Publication Form</span>
      </nav>

      <PublishCentralDeploymentForm
        templates={activeTemplates}
        yearLevels={yearLevels}
        majors={majors}
        programLabel={`${program.code} — ${program.name}`}
        preselectedTemplateId={preselectedTemplateId}
        publishAction={publishCentralDeploymentAction}
      />
    </div>
  );
}
