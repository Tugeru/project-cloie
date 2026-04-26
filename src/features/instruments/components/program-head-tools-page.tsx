"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Eye, MoreVertical, Pencil, Plus, Send, Trash2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProgramHeadDeploymentItem } from "@/features/evaluations/services/list-program-head-deployments";
import type { ProgramHeadTemplateItem } from "@/features/instruments/services/manage-program-head-templates";
import { closeCentralDeploymentAction } from "@/lib/actions/central-deployment-actions";
import {
  deleteTemplateAction,
  duplicateTemplateAction,
  toggleTemplateActiveAction,
} from "@/lib/actions/program-head-template-actions";

type ProgramHeadToolsPageProps = {
  templates: ProgramHeadTemplateItem[];
  deployments: ProgramHeadDeploymentItem[];
  program: { id: string; code: string; name: string };
};

function formatDate(date: Date | string | null): string {
  if (!date) return "--";
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
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

export function ProgramHeadToolsPage({
  templates,
  deployments,
  program,
}: ProgramHeadToolsPageProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">Evaluation Tools</h1>
          <p className="font-body text-on-surface-variant mt-2 text-sm">
            Manage templates and published deployments for{" "}
            <span className="font-semibold">{program.name}</span>.
          </p>
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList variant="line" className="h-auto gap-4">
            <TabsTrigger value="templates" className="px-1 py-2.5 text-sm">
              Templates
            </TabsTrigger>
            <TabsTrigger value="published" className="px-1 py-2.5 text-sm">
              Published
            </TabsTrigger>
          </TabsList>

          <Button
            render={<Link href="/program-head/tools/new" />}
            className="bg-primary font-label text-on-primary hover:bg-primary-hover shrink-0 font-semibold"
          >
            <Plus className="size-4" data-icon="inline-start" />
            Create New Template
          </Button>
        </div>

        <TabsContent value="templates" className="pt-6">
          <TemplatesGrid templates={templates} />
        </TabsContent>

        <TabsContent value="published" className="pt-6">
          <PublishedList deployments={deployments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TemplatesGrid({ templates }: { templates: ProgramHeadTemplateItem[] }) {
  if (templates.length === 0) {
    return (
      <div className="border-outline-variant rounded-xl border-2 border-dashed py-16 text-center">
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

function TemplateCard({ template }: { template: ProgramHeadTemplateItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isInstitutional = template.program_id === null;
  const isProgramWide = template.template_type === "PROGRAM_WIDE";

  function handleDuplicate() {
    setError(null);
    startTransition(async () => {
      const result = await duplicateTemplateAction(template.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleToggleActive() {
    setError(null);
    startTransition(async () => {
      const result = await toggleTemplateActiveAction(template.id, !template.is_active);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleConfirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteTemplateAction(template.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setShowDeleteDialog(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="group bg-surface-container-lowest relative flex flex-col rounded-2xl p-5 shadow-sm transition-shadow hover:shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <span
            className={`font-label inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${
              template.is_active
                ? "bg-primary-fixed text-on-primary-fixed"
                : "bg-surface-container-highest text-on-surface-variant"
            }`}
          >
            {template.is_active ? "Active" : "Inactive"}
          </span>

          {!isInstitutional && (
            <DropdownMenu>
              <DropdownMenuTrigger className="text-text-muted hover:bg-surface-muted hover:text-text-primary inline-flex size-7 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100">
                <MoreVertical className="size-4" />
                <span className="sr-only">Actions</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                <DropdownMenuItem disabled={isPending} onClick={handleToggleActive}>
                  {template.is_active ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isPending}
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <h3 className="font-headline text-on-surface text-lg font-semibold">{template.name}</h3>
        <p className="font-body text-on-surface-variant mt-1 line-clamp-2 text-sm">
          {template.description ?? "No description."}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-label text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
            {isInstitutional ? "Institutional baseline" : "Program-owned"} -{" "}
            {template._count.versions} version(s)
          </span>
          <Badge variant="secondary" className="text-xs">
            {isProgramWide ? "Program-wide" : "Course-bound"}
          </Badge>
          {template.is_faculty_accessible && (
            <Badge variant="outline" className="text-xs">
              Faculty Access
            </Badge>
          )}
        </div>

        {error && <p className="text-error mt-2 text-xs font-medium">{error}</p>}

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
            className="bg-primary text-on-primary hover:bg-primary-hover flex-1"
            disabled={isPending || !isProgramWide}
            render={
              isProgramWide ? (
                <Link href={`/program-head/tools/publish?templateId=${template.id}`} />
              ) : undefined
            }
          >
            <Send className="size-3.5" data-icon="inline-start" />
            Publish
          </Button>
        </div>
      </div>

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteDialog(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{template.name}</span>{" "}
              ({template.code})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={isPending} onClick={handleConfirmDelete}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PublishedList({ deployments }: { deployments: ProgramHeadDeploymentItem[] }) {
  if (deployments.length === 0) {
    return (
      <div className="border-outline-variant rounded-xl border-2 border-dashed py-16 text-center">
        <p className="font-body text-on-surface-variant">No published tools yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="font-label text-on-surface-variant hidden rounded-lg px-4 py-2 text-xs font-semibold tracking-[0.05em] uppercase md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto]">
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

function DeploymentRow({ deployment }: { deployment: ProgramHeadDeploymentItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canClose = deployment.status === "ACTIVE" || deployment.status === "SCHEDULED";

  function handleClose() {
    setError(null);
    startTransition(async () => {
      const result = await closeCentralDeploymentAction(deployment.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className={`group hover:bg-surface-container-low grid items-center gap-3 rounded-xl px-4 py-3 transition-colors md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div>
        <p className="font-headline text-on-surface font-semibold">{deployment.templateName}</p>
        {error && <p className="text-error mt-0.5 text-xs">{error}</p>}
      </div>

      <div>
        <span className="bg-surface-container font-label text-on-surface-variant inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
          {formatStakeholder(deployment.target_stakeholder)}
        </span>
      </div>

      <div className="text-on-surface-variant text-sm">
        {deployment.academic_year} - {formatSemester(deployment.semester)}
      </div>

      <div className="text-on-surface-variant font-mono text-sm">
        {formatDate(deployment.created_at)}
      </div>

      <div>
        <span
          className={`font-label inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(deployment.status)}`}
        >
          {deployment.status.charAt(0) + deployment.status.slice(1).toLowerCase()}
        </span>
      </div>

      <div className="text-on-surface-variant text-sm">
        {deployment.responseCount}/{deployment.assignmentCount}
      </div>

      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger className="text-text-muted hover:bg-surface-muted hover:text-text-primary inline-flex size-7 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100">
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
                <DropdownMenuItem variant="destructive" onClick={handleClose}>
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
