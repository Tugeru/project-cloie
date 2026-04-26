import { listBaselineTemplates } from "@/features/instruments/services/manage-instruments";
import { AdminToolsPage } from "@/features/instruments/components/admin-tools-page";

export default async function AdminInstrumentsPage() {
  const templates = await listBaselineTemplates();

  return <AdminToolsPage templates={JSON.parse(JSON.stringify(templates))} />;
}
