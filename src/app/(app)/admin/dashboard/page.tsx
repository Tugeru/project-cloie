import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const [userCount, programCount, courseCount, templateCount, yearLevelCount, inviteCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.program.count({ where: { is_active: true } }),
      prisma.course.count({ where: { is_active: true } }),
      prisma.instrumentTemplate.count({ where: { is_active: true } }),
      prisma.yearLevel.count(),
      prisma.externalStakeholderInvite.count(),
    ]);

  const quickLinks = [
    { href: "/admin/users", label: "Users, roles, and invites" },
    { href: "/admin/programs", label: "Programs and majors" },
    { href: "/admin/courses", label: "Course catalog" },
    { href: "/admin/year-levels", label: "Year levels" },
    { href: "/admin/instruments", label: "Baseline instruments" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-text-secondary">
          Operate the academic and access foundation that powers every downstream
          stakeholder workflow.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "Users", value: userCount },
          { label: "Programs", value: programCount },
          { label: "Courses", value: courseCount },
          { label: "Templates", value: templateCount },
          { label: "Year Levels", value: yearLevelCount },
          { label: "Invite Drafts", value: inviteCount },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Workflows</CardTitle>
          <CardDescription>
            These pages now serve as the operational foundation for catalog, access,
            and baseline governance.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
            >
              {link.label}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
