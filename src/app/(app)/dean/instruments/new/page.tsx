import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ManagementTemplateBuilder } from "@/features/instruments/components/management-template-builder";
import { createDeanTemplateAction } from "@/lib/actions/dean-template-actions";

export default function DeanCreateTemplatePage() {
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
        onSave={createDeanTemplateAction}
        programLabel="Institutional Baseline"
        toolsHref="/dean/instruments"
      />
    </div>
  );
}
