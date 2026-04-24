import { listAdminProgramsSummary } from "@/features/academic-structure/services/list-admin-programs-summary";
import { AdminProgramsList } from "@/features/academic-structure/components/admin-programs-list";

export default async function AdminProgramsPage() {
  const { programs, kpi } = await listAdminProgramsSummary();
  return <AdminProgramsList programs={programs} kpi={kpi} />;
}
