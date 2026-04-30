import { listBaselineTemplates } from "@/features/instruments/services/manage-instruments";
import { AdminToolsPage } from "@/features/instruments/components/admin-tools-page";
import {
  toggleDeanTemplateActiveAction,
  duplicateDeanTemplateAction,
  deleteDeanTemplateAction,
} from "@/lib/actions/dean-template-actions";

export default async function DeanInstrumentsPage() {
  const templates = await listBaselineTemplates();

  return (
    <AdminToolsPage
      templates={JSON.parse(JSON.stringify(templates))}
      basePath="/dean/instruments"
      actions={{
        onToggleActive: toggleDeanTemplateActiveAction,
        onDuplicate: duplicateDeanTemplateAction,
        onDelete: deleteDeanTemplateAction,
      }}
    />
  );
}
