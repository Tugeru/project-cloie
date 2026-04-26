"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Edit, FileText, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { showToast } from "@/components/ui/toast";
import { duplicateFacultyTemplateAction } from "@/lib/actions/faculty-template-actions";
import type { FacultyTemplateItem } from "../services/list-faculty-templates";

type FacultyToolsPageProps = {
  program: { code: string; id: string; name: string };
  templates: FacultyTemplateItem[];
};

export function FacultyToolsPage({ program, templates }: FacultyToolsPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDuplicate(templateId: string) {
    startTransition(async () => {
      const result = await duplicateFacultyTemplateAction(templateId);

      if (!result.success) {
        showToast(result.error, "error");
        return;
      }

      showToast("Template duplicated successfully.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading-lg">Evaluation Tools</h1>
        <p className="text-body-md text-text-secondary">
          Templates with faculty access enabled for{" "}
          <span className="font-semibold text-primary">
            {program.code} - {program.name}
          </span>
          .
        </p>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-4 size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No templates with faculty access are available yet. Contact your Program Head
              to enable faculty access on evaluation templates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const isOwned = Boolean(template.facultyOwnerId);

            return (
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
                    <Badge variant={isOwned ? "secondary" : "default"} className="shrink-0">
                      {isOwned ? "My Copy" : "Shared"}
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
                        ? `${template.programCode} - Program-owned`
                        : "Institutional baseline"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {template.versionCount} version
                      {template.versionCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      render={<Link href={`/faculty/tools/${template.id}/edit`} />}
                    >
                      <Edit className="mr-2 size-4" />
                      Edit Template
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={isPending}
                      onClick={() => handleDuplicate(template.id)}
                    >
                      <Copy className="mr-2 size-4" />
                      Duplicate
                    </Button>
                    {isOwned && (
                      <Button
                        size="sm"
                        className="w-full"
                        render={
                          <Link href={`/faculty/cilo-evaluations/new?templateId=${template.id}`} />
                        }
                      >
                        <Send className="mr-2 size-4" />
                        Publish
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
