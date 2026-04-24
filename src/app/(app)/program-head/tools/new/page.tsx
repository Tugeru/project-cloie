import { redirect } from "next/navigation";
import Link from "next/link";
import { listProgramHeadTemplates } from "@/features/instruments/services/manage-program-head-templates";
import { TemplateBuilder } from "@/features/instruments/components/template-builder";
import { createProgramHeadTemplateAction } from "@/lib/actions/program-head-template-actions";

export const metadata = {
  title: "New Template — Program Head | CLOIE",
};

export default async function ProgramHeadNewToolPage() {
  const result = await listProgramHeadTemplates();

  if (!result.success) {
    redirect("/unauthorized");
  }

  const { program } = result.data;

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
        onSave={createProgramHeadTemplateAction}
        programLabel={`${program.code} — ${program.name}`}
      />
    </div>
  );
}
