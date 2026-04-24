import { AdminUserManagement } from "@/features/users/components/admin-user-management";
import {
  listAdminUsers,
  listExternalStakeholderInvites,
} from "@/features/users/services/manage-users";
import { prisma } from "@/lib/db/prisma";

export default async function AdminUsersPage() {
  const [users, invites, programs, yearLevels] = await Promise.all([
    listAdminUsers(),
    listExternalStakeholderInvites(),
    prisma.program.findMany({
      where: { is_active: true },
      include: {
        majors: {
          where: { is_active: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { code: "asc" },
    }),
    prisma.yearLevel.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-text-secondary">
          Manage role assignments, student academic context, faculty and leadership
          scoping, and invite-ready external stakeholder records.
        </p>
      </div>

      <AdminUserManagement
        users={users}
        programs={programs}
        yearLevels={yearLevels}
        invites={invites}
      />
    </div>
  );
}
