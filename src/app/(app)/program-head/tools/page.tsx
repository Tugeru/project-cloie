import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function ProgramHeadToolsPage() {
  const [templates, deployments] = await Promise.all([
    prisma.instrumentTemplate.findMany({
      include: {
        _count: {
          select: {
            versions: true,
          },
        },
      },
      orderBy: { code: "asc" },
      take: 6,
    }),
    prisma.centralDeployment.findMany({
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
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight">Evaluation Tools</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Manage program-owned templates, faculty-access rules, and published
            stakeholder deployments.
          </p>
        </div>
        <Button render={<Link href="/program-head/tools/new" />} className="font-semibold">
          Create New Template
        </Button>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="h-auto gap-2 bg-surface-container-low p-1">
          <TabsTrigger value="templates" className="px-6 py-2.5">
            Templates
          </TabsTrigger>
          <TabsTrigger value="published" className="px-6 py-2.5">
            Published
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="border-border shadow-sm">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {template.is_faculty_accessible && (
                      <Badge variant="outline">Faculty Access</Badge>
                    )}
                  </div>
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{template.code}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-text-muted">
                    {template.description ?? "No description yet."}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    {template.program_id ? "Program-owned" : "Institutional baseline"} •{" "}
                    {template._count.versions} version(s)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Duplicate
                    </Button>
                    <Button size="sm" className="flex-1">
                      Publish
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="published" className="pt-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Published Evaluation Tools</CardTitle>
              <CardDescription>
                Review current deployments and their preserved template context.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {deployments.map((deployment) => (
                <div
                  key={deployment.id}
                  className="grid gap-3 rounded-xl border border-border px-4 py-4 md:grid-cols-[2fr_1.5fr_1fr_1fr]"
                >
                  <div>
                    <p className="font-medium">{deployment.instrument.template.name}</p>
                    <p className="text-sm text-text-muted">
                      {deployment.program?.code ?? "College-wide"}
                      {deployment.major ? ` • ${deployment.major.name}` : ""}
                      {deployment.year_level ? ` • ${deployment.year_level.name}` : ""}
                    </p>
                  </div>
                  <div className="text-sm text-text-secondary">
                    {deployment.target_stakeholder}
                  </div>
                  <div className="text-sm text-text-secondary">{deployment.academic_year}</div>
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={deployment.status === "ACTIVE" ? "default" : "secondary"}>
                      {deployment.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
              {deployments.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
                  <p className="font-medium text-text-muted">
                    No published tools yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
