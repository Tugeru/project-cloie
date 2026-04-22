import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AlumniDashboardPage() {
  const deployments = await prisma.centralDeployment.findMany({
    where: {
      target_stakeholder: "ALUMNI",
    },
    include: {
      instrument: {
        include: {
          template: true,
        },
      },
      program: true,
    },
    orderBy: { created_at: "desc" },
    take: 6,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Alumni Dashboard</h1>
        <p className="text-sm text-text-secondary">Authenticated alumni accounts will use this portal for assigned evaluations and status views.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {deployments.map((deployment) => (
          <Card key={deployment.id}>
            <CardHeader>
              <CardTitle>{deployment.instrument.template.name}</CardTitle>
              <CardDescription>{deployment.program?.name ?? "College-wide"}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/alumni/evaluations/${deployment.id}`} className="text-sm font-medium text-primary hover:underline">
                Open scaffolded evaluation
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
