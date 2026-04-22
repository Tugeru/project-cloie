import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProgramHeadToolsPage() {
  const templates = await prisma.instrumentTemplate.findMany({
    orderBy: { code: "asc" },
    take: 6,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Program Tools</h1>
          <p className="text-sm text-text-secondary">
            Review baseline templates and prototype the program-level builder flow.
          </p>
        </div>
        <Link
          href="/program-head/tools/new"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          New Tool Draft
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.code}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted">{template.description ?? "No description yet."}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
