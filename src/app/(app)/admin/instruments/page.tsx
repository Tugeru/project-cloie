import { AdminTemplateManagement } from "@/features/instruments/components/admin-template-management";
import { listBaselineTemplates } from "@/features/instruments/services/manage-instruments";

export default async function AdminInstrumentsPage() {
  const templates = await listBaselineTemplates();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Instruments</h1>
        <p className="text-sm text-text-secondary">
          Institutional baseline instruments stay governed centrally, with program-head
          tooling layered on top.
        </p>
      </div>

      <AdminTemplateManagement templates={templates} />
    </div>
  );
}
