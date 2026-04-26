import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TemplateBuilder } from "@/features/instruments/components/template-builder";
import { createAdminTemplateAction } from "@/lib/actions/admin-template-actions";

export default function AdminCreateTemplatePage() {
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
        onSave={createAdminTemplateAction}
        programLabel="Institutional Baseline"
      />
    </div>
  );
}
