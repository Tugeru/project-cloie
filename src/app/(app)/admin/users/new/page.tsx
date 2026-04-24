import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { AddUserForm } from "@/features/users/components/add-user-form";
import { createAdminUserAction } from "@/lib/actions/admin-user-crud-actions";

export default async function AddNewUserPage() {
  const programs = await prisma.program.findMany({
    where: { is_active: true },
    include: {
      majors: { where: { is_active: true }, orderBy: { name: "asc" } },
    },
    orderBy: { code: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      {/* Breadcrumb */}
      <nav className="text-xs text-text-muted">
        User &gt; Add New User
      </nav>

      <AddUserForm programs={programs} createAction={createAdminUserAction} />
    </div>
  );
}
