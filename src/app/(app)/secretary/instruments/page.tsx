import { listBaselineTemplates } from "@/features/instruments/services/manage-instruments";
import { ManagementToolsPage } from "@/features/instruments/components/management-tools-page";

export default async function SecretaryInstrumentsPage() {
  const templates = await listBaselineTemplates();

  return <ManagementToolsPage templates={JSON.parse(JSON.stringify(templates))} />;
}
