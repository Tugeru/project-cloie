"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  duplicateTemplateAction,
  toggleTemplateActiveAction,
} from "@/lib/actions/program-head-template-actions";
import { closeCentralDeploymentAction } from "@/lib/actions/central-deployment-actions";
import type { ProgramHeadTemplateItem } from "@/features/instruments/services/manage-program-head-templates";
import type { ProgramHeadDeploymentItem } from "@/features/evaluations/services/list-program-head-deployments";
import { MoreVertical, Plus, Copy, Pencil, Send, Eye, XCircle } from "lucide-react";

// Props

type ProgramHeadToolsPageProps = {
  templates: ProgramHeadTemplateItem[];
  deployments: ProgramHeadDeploymentItem[];
  program: { id: string; code: string; name: string };
};

// Helpers

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatStakeholder(stakeholder: string): string {
  return stakeholder
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatSemester(semester: string): string {
  if (semester === "FIRST" || semester === "1ST") return "1st Sem";
  if (semester === "SECOND" || semester === "2ND") return "2nd Sem";
  if (semester === "SUMMER") return "Summer";
  return semester;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-primary-fixed text-on-primary-fixed";
    case "SCHEDULED":
      return "bg-tertiary-fixed text-on-tertiary-fixed";
    case "CLOSED":
      return "bg-surface-container-highest text-on-surface-variant";
    case "ARCHIVED":
      return "bg-surface-container-highest text-on-surface-variant opacity-60";
    case "DRAFT":
      return "bg-surface-container text-on-surface-variant";
    default:
      return "bg-surface-container-highest text-on-surface-variant";
  }
}

// Main Component

export function ProgramHeadToolsPage({
  templates,
  deployments,
  program,
}: ProgramHeadToolsPageProps) {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">
            Evaluation Tools
          </h1>
          <p className="mt-2 font-body text-sm text-on-surface-variant">
            Manage templates and published deployments for{" "}
            <span className="font-semibold">{program.name}</span>.
          </p>
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <div className="flex items-center justify-between gap-4">
          <TabsList variant="line" className="h-auto gap-4">
            <TabsTrigger value="templates" className="px-1 py-2.5 text-sm">
              Templates
            </TabsTrigger>
            <TabsTrigger value="published" className="px-1 py-2.5 text-sm">
              Published
            </TabsTrigger>
          </TabsList>

          {/* Contextual action button per tab — rendered via CSS visibility */}
          <div className="flex gap-2">
            <Button
              render={<Link href="/program-head/tools/new" />}
              className="bg-gradient-to-br from-primary to-primary-container font-label font-semibold text-on-primary"
            >
              <Plus className="size-4" data-icon="inline-start" />
              Create New Template
            </Button>
          </div>
        </div>

        {/* Templates Tab */}
        <TabsContent value="templates" className="pt-6">
          <TemplatesGrid templates={templates} />
        </TabsContent>

        {/* Published Tab */}
        <TabsContent value="published" className="pt-6">
          <PublishedList deployments={deployments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Templates Grid

function TemplatesGrid({ templates }: { templates: ProgramHeadTemplateItem[] }) {
  if (templates.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-outline-variant py-16 text-center">
        <p className="font-body text-on-surface-variant">
          No templates found. Create your first template to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
}

// Template Card

function TemplateCard({ template }: { template: ProgramHeadTemplateItem }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isInstitutional = template.program_id === null;

  function handleDuplicate() {
    setError(null);
    startTransition(async () => {
      const result = await duplicateTemplateAction(template.id);
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  function handleToggleActive() {
    setError(null);
    startTransition(async () => {
      const result = await toggleTemplateActiveAction(
        template.id,
        !template.is_active,
      );
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="group relative flex flex-col rounded-2xl bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Top row: status + overflow menu */}
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-label font-semibold tracking-wide ${
            template.is_active
              ? "bg-primary-fixed text-on-primary-fixed"
              : "bg-surface-container-highest text-on-surface-variant"
          }`}
        >
          {template.is_active ? "Active" : "Inactive"}
        </span>

        {!isInstitutional && (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex size-7 items-center justify-center rounded-md text-text-muted opacity-0 transition-opacity hover:bg-surface-muted hover:text-text-primary group-hover:opacity-100">
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom">
              <DropdownMenuItem onClick={handleToggleActive}>
                {template.is_active ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  // Delete not implemented in this phase
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Template name + description */}
      <h3 className="font-headline text-lg font-semibold text-on-surface">
        {template.name}
      </h3>
      <p className="mt-1 line-clamp-2 font-body text-sm text-on-surface-variant">
        {template.description ?? "No description."}
      </p>

      {/* Ownership + Faculty Access */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-label font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
          {isInstitutional ? "Institutional baseline" : "Program-owned"} •{" "}
          {template._count.versions} version(s)
        </span>
        {template.is_faculty_accessible && (
          <Badge variant="outline" className="text-xs">
            Faculty Access
          </Badge>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-xs font-medium text-error">{error}</p>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={isInstitutional || isPending}
          render={
            isInstitutional ? undefined : (
              <Link href={`/program-head/tools/${template.id}/edit`} />
            )
          }
        >
          <Pencil className="size-3.5" data-icon="inline-start" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={isPending}
          onClick={handleDuplicate}
        >
          <Copy className="size-3.5" data-icon="inline-start" />
          Duplicate
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-gradient-to-br from-primary to-primary-container text-on-primary"
          disabled={isPending}
          render={
            <Link
              href={`/program-head/tools/publish?templateId=${template.id}`}
            />
          }
        >
          <Send className="size-3.5" data-icon="inline-start" />
          Publish
        </Button>
      </div>
    </div>
  );
}

// Published List

function PublishedList({
  deployments,
}: {
  deployments: ProgramHeadDeploymentItem[];
}) {
  if (deployments.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-outline-variant py-16 text-center">
        <p className="font-body text-on-surface-variant">
          No published tools yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header row */}
      <div className="hidden rounded-lg px-4 py-2 text-xs font-label font-semibold uppercase tracking-[0.05em] text-on-surface-variant md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto]">
        <span>Published Form</span>
        <span>Target</span>
        <span>Academic Period</span>
        <span>Published</span>
        <span>Status</span>
        <span>Responses</span>
        <span className="w-8" />
      </div>

      {deployments.map((deployment) => (
        <DeploymentRow key={deployment.id} deployment={deployment} />
      ))}
    </div>
  );
}

// Deployment Row

function DeploymentRow({
  deployment,
}: {
  deployment: ProgramHeadDeploymentItem;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canClose =
    deployment.status === "ACTIVE" || deployment.status === "SCHEDULED";

  function handleClose() {
    setError(null);
    startTransition(async () => {
      const result = await closeCentralDeploymentAction(deployment.id);
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <div
      className={`group grid items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-surface-container-low md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] ${
        isPending ? "opacity-60" : ""
      }`}
    >
      {/* Form title */}
      <div>
        <p className="font-headline font-semibold text-on-surface">
          {deployment.templateName}
        </p>
        {error && (
          <p className="mt-0.5 text-xs text-error">{error}</p>
        )}
      </div>

      {/* Target stakeholder */}
      <div>
        <span className="inline-flex items-center rounded-full bg-surface-container px-2 py-0.5 text-xs font-label font-medium text-on-surface-variant">
          {formatStakeholder(deployment.target_stakeholder)}
        </span>
      </div>

      {/* Academic period */}
      <div className="text-sm text-on-surface-variant">
        {deployment.academic_year} • {formatSemester(deployment.semester)}
      </div>

      {/* Publication date */}
      <div className="font-mono text-sm text-on-surface-variant">
        {formatDate(deployment.created_at)}
      </div>

      {/* Status */}
      <div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-label font-semibold ${getStatusColor(deployment.status)}`}
        >
          {deployment.status.charAt(0) +
            deployment.status.slice(1).toLowerCase()}
        </span>
      </div>

      {/* Assignment / Response counts */}
      <div className="text-sm text-on-surface-variant">
        {deployment.responseCount}/{deployment.assignmentCount}
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex size-7 items-center justify-center rounded-md text-text-muted opacity-0 transition-opacity hover:bg-surface-muted hover:text-text-primary group-hover:opacity-100">
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom">
            <DropdownMenuItem>
              <Eye className="size-4" />
              View
            </DropdownMenuItem>
            {canClose && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleClose}
                >
                  <XCircle className="size-4" />
                  Close Deployment
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
