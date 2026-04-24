import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProgramHeadTemplate } from "@/features/instruments/services/manage-program-head-templates";
import { TemplateBuilder } from "@/features/instruments/components/template-builder";
import { updateProgramHeadTemplateAction } from "@/lib/actions/program-head-template-actions";

export const metadata = {
  title: "Edit Template — Program Head | CLOIE",
};

interface EditTemplatePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProgramHeadEditToolPage({
  params,
}: EditTemplatePageProps) {
  const { id } = await params;
  const result = await getProgramHeadTemplate(id);

  if (!result.success) {
    if (
      result.error === "Template not found." ||
      result.error === "You do not have permission to view this template."
    ) {
      notFound();
    }
    redirect("/unauthorized");
  }

  const { template, program } = result.data;

  return (
    <div className="space-y-4">
      <Link
        href="/program-head/tools"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Evaluation Tools
      </Link>

      <TemplateBuilder
        initialData={{
          id: template.id,
          name: template.name,
          description: template.description ?? "",
          is_active: template.is_active,
          is_faculty_accessible: template.is_faculty_accessible,
          structure: template.structure,
        }}
        onSave={updateProgramHeadTemplateAction}
        programLabel={`${program.code} — ${program.name}`}
      />
    </div>
  );
}
