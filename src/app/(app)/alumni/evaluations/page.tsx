import Link from "next/link";
import { TargetStakeholder } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export default async function AlumniEvaluationsPage() {
  const deployments = await prisma.centralDeployment.findMany({
    where: { target_stakeholder: TargetStakeholder.ALUMNI },
    include: {
      instrument: { include: { template: true } },
      program: true,
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Alumni Evaluations</h1>
        <p className="text-sm text-text-secondary">Scaffolded list of deployments prepared for authenticated alumni respondents.</p>
      </div>
      {deployments.map((deployment) => (
        <Link key={deployment.id} href={`/alumni/evaluations/${deployment.id}`} className="block rounded-xl border border-border px-4 py-3 hover:border-primary/40 hover:bg-primary-soft/40">
          <p className="font-medium">{deployment.instrument.template.name}</p>
          <p className="text-sm text-text-muted">{deployment.program?.name ?? "College-wide"}</p>
        </Link>
      ))}
    </div>
  );
}
