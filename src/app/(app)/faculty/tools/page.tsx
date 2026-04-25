import Link from "next/link";
import { Edit, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listFacultyTemplates } from "@/features/instruments/services/list-faculty-templates";

export default async function FacultyToolsPage() {
  const result = await listFacultyTemplates();

  if (!result.success) {
    return (
      <div className="space-y-4">
        <h1 className="text-heading-lg">Evaluation Tools</h1>
        <p className="text-body-md text-text-secondary">{result.error}</p>
      </div>
    );
  }

  const { templates, program } = result;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-heading-lg">Evaluation Tools</h1>
        <p className="text-body-md text-text-secondary">
          Templates with faculty access enabled for{" "}
          <span className="font-semibold text-primary">
            {program.code} — {program.name}
          </span>
          .
        </p>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-4 size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No templates with faculty access are available yet. Contact your
              Program Head to enable faculty access on evaluation templates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold">
                      {template.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {template.code}
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="shrink-0">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {template.description && (
                  <p className="line-clamp-2 text-sm text-text-secondary">
                    {template.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {template.programCode
                      ? `${template.programCode} · Program-owned`
                      : "Institutional baseline"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {template.versionCount} version
                    {template.versionCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  render={
                    <Link href={`/faculty/tools/${template.id}/edit`} />
                  }
                >
                  <Edit className="mr-2 size-4" />
                  Edit Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
