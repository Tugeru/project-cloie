import { listSecretaryUsersSummary } from "@/features/users/services/list-secretary-users-summary";
import { SecretaryUsersList } from "@/features/users/components/secretary-users-list/index";

export default async function SecretaryUsersPage() {
  const { users, kpi, programs, yearLevels } = await listSecretaryUsersSummary();

  return <SecretaryUsersList users={users} kpi={kpi} programs={programs} yearLevels={yearLevels} />;
}
