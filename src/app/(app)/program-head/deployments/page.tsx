import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/db/prisma";

export default async function ProgramHeadDeploymentsPage() {
  const deployments = await prisma.centralDeployment.findMany({
    include: {
      instrument: {
        include: {
          template: true,
        },
      },
      major: true,
      program: true,
      year_level: true,
    },
    orderBy: { created_at: "desc" },
    take: 8,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          Publish Evaluation Tool
        </h1>
        <p className="text-sm text-text-secondary">
          Configure the deployment schedule and audience targeting for stakeholder tools.
          Student-targeted deployments use program, optional major, and year level.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deployment Planner</CardTitle>
          <CardDescription>
            This form now mirrors the intended publication IA while persistence is still
            being wired.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-2">
            <Label htmlFor="tool-name">Published Evaluation Tool Name</Label>
            <Input id="tool-name" defaultValue="BSIT Industry Partners Evaluation Tool" />
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Deployment Schedule</h3>
              <div className="space-y-2">
                <Label htmlFor="activation-date">Activation Date</Label>
                <Input id="activation-date" type="datetime-local" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline-date">Deadline Date</Label>
                <Input id="deadline-date" type="datetime-local" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold">Audience Targeting</h3>
              <div className="space-y-2">
                <Label>Target Stakeholder</Label>
                <Select defaultValue="industry">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="graduating">Graduating Students</SelectItem>
                    <SelectItem value="alumni">Alumni</SelectItem>
                    <SelectItem value="industry">Industry Partners</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Program Context</Label>
                <Input defaultValue="BSIT" />
              </div>
              <div className="space-y-2">
                <Label>Major Context</Label>
                <Input placeholder="Optional major for narrowed targeting" />
              </div>
              <div className="space-y-2">
                <Label>Year Level</Label>
                <Input placeholder="Used for student-targeted tools only" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deployment-notes">Deployment Notes</Label>
            <Textarea
              id="deployment-notes"
              rows={4}
              placeholder="Audience rules, invite assumptions, and scheduling notes..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Published Tools</CardTitle>
          <CardDescription>
            Review recent deployments and their preserved audience context.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {deployments.map((deployment) => (
            <div key={deployment.id} className="rounded-xl border border-border px-4 py-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{deployment.instrument.template.name}</p>
                  <p className="text-sm text-text-muted">
                    {deployment.target_stakeholder} • {deployment.program?.code ?? "College-wide"}
                    {deployment.major ? ` • ${deployment.major.name}` : ""}
                    {deployment.year_level ? ` • ${deployment.year_level.name}` : ""}
                  </p>
                </div>
                <div className="text-sm font-medium text-text-secondary">
                  {deployment.status} • {deployment.academic_year}
                </div>
              </div>
            </div>
          ))}
          {deployments.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
              <p className="font-medium text-text-muted">No deployments yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
