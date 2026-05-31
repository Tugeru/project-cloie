import { listAdminUsersSummary } from "@/features/users/services/list-admin-users-summary";
import { AdminUsersList } from "@/features/users/components/admin-users-list/index";

export default async function AdminUsersPage() {
  const { users, kpi, programs, yearLevels } = await listAdminUsersSummary();

  return <AdminUsersList users={users} kpi={kpi} programs={programs} yearLevels={yearLevels} />;
}
