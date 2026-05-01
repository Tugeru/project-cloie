import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminTemplateBuilder } from "@/features/instruments/components/admin-template-builder";
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

      <AdminTemplateBuilder
        onSave={createDeanTemplateAction}
        programLabel="Institutional Baseline"
      />
    </div>
  );
}
