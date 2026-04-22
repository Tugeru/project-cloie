import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DeanDashboardPage() {
  const [programCount, deploymentCount, responseCount] = await Promise.all([
    prisma.program.count({ where: { is_active: true } }),
    prisma.centralDeployment.count(),
    prisma.response.count({ where: { status: "SUBMITTED" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Dean Dashboard</h1>
        <p className="text-sm text-text-secondary">
          College-wide analytics remain aligned to the same portal model as program heads, with broader scope.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Programs", value: programCount },
          { label: "Deployments", value: deploymentCount },
          { label: "Submitted Responses", value: responseCount },
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
            { href: "/dean/cilo-reviews", label: "College CILO reviews" },
            { href: "/dean/analytics", label: "College analytics" },
            { href: "/dean/reports", label: "Report stubs" },
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
