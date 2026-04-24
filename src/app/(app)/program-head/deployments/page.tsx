import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listProgramHeadDeployments } from "@/features/evaluations/services/list-program-head-deployments";
import { getSemesterLabel } from "@/lib/constants/academic";

export default async function ProgramHeadDeploymentsPage() {
  const result = await listProgramHeadDeployments();

  if (!result.success) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Deployments</h1>
        <p className="text-sm text-danger">{result.error}</p>
      </div>
    );
  }

  const { deployments, program } = result.data;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-4xl font-bold tracking-tight">
            Deployment Summary
          </h1>
          <p className="text-sm text-text-secondary">
            Review published stakeholder tools for {program.code} - {program.name}.
            Use the Tools publication flow to launch new graduating-student deployments.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/program-head/tools">Back to Tools</Link>
          </Button>
          <Button asChild>
            <Link href="/program-head/tools/publish">Publish New Deployment</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Deployments</CardDescription>
            <CardTitle className="text-3xl">{deployments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Assignments Created</CardDescription>
            <CardTitle className="text-3xl">
              {deployments.reduce((total, deployment) => total + deployment.assignmentCount, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Submitted Responses</CardDescription>
            <CardTitle className="text-3xl">
              {deployments.reduce((total, deployment) => total + deployment.responseCount, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Published Tools</CardTitle>
          <CardDescription>
            Deployment records preserve template version, audience scope, and response
            counts for the active academic period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deployments.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
              <p className="font-medium text-text-muted">No deployments yet.</p>
            </div>
          )}

          {deployments.map((deployment) => (
            <div
              key={deployment.id}
              className="space-y-3 rounded-xl border border-border p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-text-primary">
                    {deployment.templateName}
                  </p>
                  <p className="text-sm text-text-muted">
                    {deployment.target_stakeholder.replaceAll("_", " ")} •{" "}
                    {deployment.programCode ?? "College-wide"}
                    {deployment.majorName ? ` • ${deployment.majorName}` : ""}
                    {deployment.yearLevelName ? ` • ${deployment.yearLevelName}` : ""}
                  </p>
                </div>
                <Badge variant="secondary">{deployment.status}</Badge>
              </div>

              <div className="grid gap-3 text-sm text-text-secondary md:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Academic Period
                  </p>
                  <p>
                    {deployment.academic_year} • {getSemesterLabel(deployment.semester)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Assignment Count
                  </p>
                  <p>{deployment.assignmentCount}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Response Count
                  </p>
                  <p>{deployment.responseCount}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Published
                  </p>
                  <p>
                    {deployment.created_at.toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
