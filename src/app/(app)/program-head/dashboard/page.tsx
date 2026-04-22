import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProgramHeadDashboardPage() {
  const session = await resolveAuthSession();
  const assignment = session
    ? await prisma.programHeadAssignment.findFirst({
        where: {
          is_active: true,
          program_head_id: session.userId,
        },
        include: {
          program: true,
        },
      })
    : null;

  const programId = assignment?.program_id ?? null;
  const [deploymentCount, templateCount] = programId
    ? await Promise.all([
        prisma.centralDeployment.count({ where: { program_id: programId } }),
        prisma.instrumentTemplate.count({ where: { is_active: true } }),
      ])
    : [0, 0];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Program Head Dashboard</h1>
        <p className="text-sm text-text-secondary">
          {assignment?.program
            ? `Working program context: ${assignment.program.code} - ${assignment.program.name}`
            : "No active program assignment found yet."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Program Deployments", value: deploymentCount },
          { label: "Governed Templates", value: templateCount },
          { label: "Mapped Reviews", value: "Scaffolded" },
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
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[
            { href: "/program-head/outcomes", label: "Outcome management" },
            { href: "/program-head/outcomes/mapping", label: "Mapping matrix" },
            { href: "/program-head/tools", label: "Template builder" },
            { href: "/program-head/deployments", label: "Deployment planner" },
          ].map((link) => (
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
