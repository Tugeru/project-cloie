import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ManagementTemplateBuilder } from "@/features/instruments/components/management-template-builder";
import { updateDeanTemplateAction } from "@/lib/actions/dean-template-actions";
import { getBaselineTemplate } from "@/features/instruments/services/manage-instruments";
import type { TemplateStructure } from "@/features/instruments/types";

interface DeanEditTemplatePageProps {
  params: Promise<{ id: string }>;
}

export default async function DeanEditTemplatePage({ params }: DeanEditTemplatePageProps) {
  const { id } = await params;

  const template = await getBaselineTemplate(id);

  if (!template) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dean/instruments"
        className="text-primary inline-flex items-center gap-2 text-sm font-medium hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to Tools
      </Link>

      <ManagementTemplateBuilder
        initialData={{
          id: template.id,
          name: template.name,
          description: template.description ?? "",
          template_type: template.template_type,
          is_active: template.is_active,
          is_faculty_accessible: template.is_faculty_accessible,
          structure: template.structure as unknown as TemplateStructure,
        }}
        onSave={updateDeanTemplateAction}
        programLabel="Institutional Baseline"
        toolsHref="/dean/instruments"
      />
    </div>
  );
}
