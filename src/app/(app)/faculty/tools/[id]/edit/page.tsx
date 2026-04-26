import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TemplateBuilder } from "@/features/instruments/components/template-builder";
import {
  listFacultyCourseContextsAction,
  loadFacultyManagedCilosAction,
} from "@/lib/actions/course-bound-evaluation-actions";
import {
  saveFacultyTemplateDraftAction,
  validateFacultyTemplatePublishReadinessAction,
} from "@/lib/actions/faculty-template-actions";
import { getFacultyTemplate } from "@/features/instruments/services/list-faculty-templates";
import type { TemplateStructure } from "@/features/instruments/types";

interface FacultyEditTemplatePageProps {
  params: Promise<{ id: string }>;
}

export default async function FacultyEditTemplatePage({ params }: FacultyEditTemplatePageProps) {
  const { id } = await params;

  const template = await getFacultyTemplate(id);
  const courseContexts = await listFacultyCourseContextsAction();

  if (!template) {
    notFound();
  }

  const programLabel = template.program
    ? `${template.program.code} — ${template.program.name}`
    : "Institutional Template";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/faculty/tools"
        className="text-primary inline-flex items-center gap-2 text-sm font-medium hover:underline"
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
          bound_course_id: template.bound_course_id,
          bound_major_id: template.bound_major_id,
          bound_program_id: template.bound_program_id,
          structure: template.structure as unknown as TemplateStructure,
        }}
        facultyConfig={{
          courseContexts,
          initialBindings: template.template_cilo_question_bindings
            .filter((binding) => binding.cilo_id)
            .map((binding) => ({
              ciloDescriptionSnapshot: binding.cilo_description_snapshot,
              ciloId: binding.cilo_id!,
              itemKey: binding.item_key,
              questionPromptSnapshot: binding.question_prompt_snapshot,
              sectionKey: binding.section_key,
            })),
          loadManagedCilosAction: loadFacultyManagedCilosAction,
          validatePublishReadinessAction: validateFacultyTemplatePublishReadinessAction,
        }}
        onSave={saveFacultyTemplateDraftAction}
        programLabel={programLabel}
        saveSuccessConfig={{
          redirectTo: "/faculty/tools",
          toastMessage: "Template saved successfully.",
        }}
        toolsHref="/faculty/tools"
      />
    </div>
  );
}
