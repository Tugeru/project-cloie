import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractivePlaceholderForm } from "@/components/ui/interactive-placeholder-form";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: {
      roles: true,
    },
    orderBy: { created_at: "desc" },
    take: 8,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-text-secondary">
          Review recently provisioned accounts and prepare invited external stakeholder records.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Accounts</CardTitle>
          <CardDescription>Role assignments now resolve directly from the enum-backed `user_roles` table.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col gap-1 rounded-xl border border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{user.first_name} {user.last_name}</p>
                <p className="text-sm text-text-muted">{user.email}</p>
              </div>
              <p className="text-xs uppercase tracking-wide text-text-secondary">
                {user.roles.map((role) => role.role.replaceAll("_", " ")).join(", ") || "No roles"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <InteractivePlaceholderForm
        title="Invite Account Stub"
        description="Capture the metadata needed for an invited internal or external account without sending an email yet."
        submitLabel="Save Invite Stub"
        fields={[
          { id: "email", kind: "input", label: "Email", placeholder: "name@example.com", type: "email" },
          {
            id: "role",
            kind: "select",
            label: "Role",
            options: [
              { label: "Faculty", value: "FACULTY" },
              { label: "Program Head", value: "PROGRAM_HEAD" },
              { label: "Dean", value: "DEAN" },
              { label: "Alumni", value: "ALUMNI" },
              { label: "Industry Partner", value: "INDUSTRY_PARTNER" },
            ],
          },
          { id: "program", kind: "input", label: "Program Context", placeholder: "BSIT / BSEd / BSBA" },
          { id: "notes", kind: "textarea", label: "Implementation Notes", placeholder: "Company, ownership, invite workflow notes..." },
        ]}
      />
    </div>
  );
}
