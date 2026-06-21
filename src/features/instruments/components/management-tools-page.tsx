"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  toggleAdminTemplateActiveAction,
  duplicateAdminTemplateAction,
  deleteAdminTemplateAction,
} from "@/lib/actions/admin-template-actions";

type TemplateActions = {
  onToggleActive: (id: string, is_active: boolean) => Promise<{ success: true } | { success: false; error: string }>;
  onDuplicate: (id: string) => Promise<{ success: true } | { success: false; error: string }>;
  onDelete: (id: string) => Promise<{ success: true } | { success: false; error: string }>;
};

const DEFAULT_ACTIONS: TemplateActions = {
  onToggleActive: toggleAdminTemplateActiveAction,
  onDuplicate: duplicateAdminTemplateAction,
  onDelete: deleteAdminTemplateAction,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TemplateItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  template_type: "PROGRAM_WIDE" | "COURSE_BOUND";
  is_active: boolean;
  is_faculty_accessible: boolean;
  _count: { versions: number };
};

type ManagementToolsPageProps = {
  templates: TemplateItem[];
  basePath?: string;
  actions?: TemplateActions;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ManagementToolsPage({ templates, basePath = "/secretary/instruments", actions = DEFAULT_ACTIONS }: ManagementToolsPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<TemplateItem | null>(null);

  function handleToggleActive(id: string, currentActive: boolean) {
    startTransition(async () => {
      await actions.onToggleActive(id, !currentActive);
      router.refresh();
    });
  }

  function handleDuplicate(id: string) {
    startTransition(async () => {
      await actions.onDuplicate(id);
      router.refresh();
    });
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await actions.onDelete(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-heading-lg">Evaluation Tools</h1>
          <p className="text-body-md text-text-secondary">
            Manage institutional baseline evaluation templates. These templates can be adopted by
            program heads for their programs.
          </p>
        </div>
        <Button render={<Link href={`${basePath}/new`} />} className="shrink-0">
          <Plus className="mr-2 size-4" />
          Create Template
        </Button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No baseline templates yet. Click &quot;Create Template&quot; to build your first
              evaluation tool.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="line-clamp-2 text-base font-bold">{template.name}</CardTitle>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge variant={template.is_active ? "default" : "outline"}>
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="text-text-muted hover:bg-surface-muted hover:text-text-primary inline-flex size-8 items-center justify-center rounded-md transition-colors">
                          <MoreVertical className="size-4" />
                          <span className="sr-only">Actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            render={<Link href={`${basePath}/${template.id}/edit`} />}
                          >
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isPending}
                            onClick={() => handleDuplicate(template.id)}
                          >
                            <Copy className="mr-2 size-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={isPending}
                            onClick={() => handleToggleActive(template.id, template.is_active)}
                          >
                            {template.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isPending}
                            onClick={() => setDeleteTarget(template)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {template.description && (
                  <p className="text-text-secondary line-clamp-2 text-sm">{template.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Institutional baseline</span>
                  <span>
                    {template._count.versions} version
                    {template._count.versions !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="w-fit text-xs">
                    {template.template_type === "COURSE_BOUND" ? "Course-bound" : "Program-wide"}
                  </Badge>
                  {template.is_faculty_accessible && (
                    <Badge variant="outline" className="text-xs">
                      Faculty Access
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <Dialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold">{deleteTarget.name}</span> ({deleteTarget.code})?
                This action cannot be undone and will remove all associated versions.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="destructive" disabled={isPending} onClick={handleConfirmDelete}>
                {isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
