import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TemplateBuilder } from "@/features/instruments/components/template-builder";
import { updateAdminTemplateAction } from "@/lib/actions/admin-template-actions";
import { getBaselineTemplate } from "@/features/instruments/services/manage-instruments";
import type { TemplateStructure } from "@/features/instruments/types";

interface AdminEditTemplatePageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditTemplatePage({
  params,
}: AdminEditTemplatePageProps) {
  const { id } = await params;

  const template = await getBaselineTemplate(id);

  if (!template) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/instruments"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to Tools
      </Link>

      <TemplateBuilder
        initialData={{
          id: template.id,
          name: template.name,
          description: template.description ?? "",
          template_type: template.template_type,
          is_active: template.is_active,
          is_faculty_accessible: template.is_faculty_accessible,
          structure: template.structure as unknown as TemplateStructure,
        }}
        onSave={updateAdminTemplateAction}
        programLabel="Institutional Baseline"
      />
    </div>
  );
}
