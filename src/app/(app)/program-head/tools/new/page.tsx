import { InteractivePlaceholderForm } from "@/components/ui/interactive-placeholder-form";

export default function ProgramHeadNewToolPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">New Tool Draft</h1>
        <p className="text-sm text-text-secondary">
          Create or edit a program-scoped stakeholder tool with realistic scaffolding fields.
        </p>
      </div>

      <InteractivePlaceholderForm
        title="Template Builder Stub"
        description="This interactive placeholder mirrors the upcoming program-head builder without persisting anything."
        submitLabel="Save Tool Draft"
        fields={[
          { id: "title", kind: "input", label: "Tool Title", placeholder: "Industry Partner Internship Evaluation" },
          {
            id: "stakeholder",
            kind: "select",
            label: "Stakeholder",
            options: [
              { label: "Graduating Students", value: "GRADUATING_STUDENT" },
              { label: "Alumni", value: "ALUMNI" },
              { label: "Industry Partners", value: "INDUSTRY_PARTNER" },
            ],
          },
          { id: "sections", kind: "textarea", label: "Sections", placeholder: "Section title per line" },
          { id: "questions", kind: "textarea", label: "Question Drafts", placeholder: "Likert and qualitative prompts..." },
        ]}
      />
    </div>
  );
}
