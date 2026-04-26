"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Edit,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createGOAction,
  deleteGOAction,
  updateGOAction,
} from "@/lib/actions/program-head-outcome-actions";
import type { ProgramGOItem } from "../services/manage-program-head-outcomes";

type GOFormMode = "create" | "edit";

type ProgramHeadOutcomesPageProps = {
  gos: ProgramGOItem[];
  program: { id: string; code: string; name: string };
};

function StatCard({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className="flex h-28 flex-col justify-between rounded-lg border border-border bg-surface p-5 transition-colors hover:bg-surface-alt">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span
        className={`font-heading text-3xl font-bold ${muted ? "text-text-muted" : "text-text-primary"}`}
      >
        {value}
      </span>
    </div>
  );
}

function GOFormDialog({
  mode,
  go,
  open,
  onOpenChange,
}: {
  mode: GOFormMode;
  go?: ProgramGOItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const action =
        mode === "create" ? createGOAction : updateGOAction;

      const result = await action(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Graduate Outcome" : "Edit Graduate Outcome"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new Graduate Outcome for your program."
              : "Update Graduate Outcome details."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {mode === "edit" && go && (
            <input type="hidden" name="id" value={go.id} />
          )}

          {error && (
            <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="code">GO Code</Label>
            <Input
              id="code"
              name="code"
              placeholder="e.g. GO-1"
              defaultValue={go?.code ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the graduate outcome..."
              defaultValue={go?.description ?? ""}
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : mode === "create"
                  ? "Create GO"
                  : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProgramHeadOutcomesPage({
  gos,
  program,
}: ProgramHeadOutcomesPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingGO, setEditingGO] = useState<ProgramGOItem | null>(null);
  const [deletingGO, setDeletingGO] = useState<ProgramGOItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const totalGOs = gos.length;
  const withMappings = gos.filter((go) => go._count.cilo_mappings > 0).length;

  function handleDelete(go: ProgramGOItem) {
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteGOAction(go.id);

      if (!result.success) {
        setDeleteError(result.error);
        return;
      }

      setDeletingGO(null);
      router.refresh();
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-heading-lg mb-2 font-heading text-4xl font-bold tracking-tight text-text-primary lg:text-5xl">
            Graduate Outcomes
          </h1>
          <div className="flex items-center gap-3">
            <span className="font-heading text-xl font-medium text-primary">
              {program.name}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
            <span className="text-body-md text-text-muted">
              Manage GOs for your program
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/program-head/outcomes/mapping">
            <Button variant="outline" className="inline-flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              CILO Mappings
            </Button>
          </Link>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add GO
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Total GOs" value={totalGOs} />
        <StatCard label="With CILO Mappings" value={withMappings} />
        <StatCard
          label="Without Mappings"
          value={totalGOs - withMappings}
          muted
        />
      </div>

      {/* GO List */}
      <div className="space-y-4">
        {gos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-body-md text-text-secondary">
                No Graduate Outcomes defined yet. Click &quot;Add GO&quot; to get
                started.
              </p>
            </CardContent>
          </Card>
        ) : (
          gos.map((go) => (
            <Card key={go.id} className="group transition-shadow hover:shadow-md">
              <CardContent className="flex items-start gap-4 p-5">
                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className="text-sm font-semibold">
                      {go.code}
                    </Badge>
                    <Badge
                      variant={
                        go._count.cilo_mappings > 0 ? "secondary" : "outline"
                      }
                      className="text-xs"
                    >
                      {go._count.cilo_mappings}{" "}
                      {go._count.cilo_mappings === 1 ? "CILO" : "CILOs"} mapped
                    </Badge>
                  </div>
                  <p className="text-body-md text-text-secondary">
                    {go.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Edit"
                    onClick={() => setEditingGO(go)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-danger"
                    title="Delete"
                    onClick={() => {
                      setDeleteError(null);
                      setDeletingGO(go);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <GOFormDialog
        mode="create"
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Dialog */}
      {editingGO && (
        <GOFormDialog
          mode="edit"
          go={editingGO}
          open={!!editingGO}
          onOpenChange={(open) => {
            if (!open) setEditingGO(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingGO}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingGO(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Graduate Outcome</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deletingGO?.code}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
              {deleteError}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeletingGO(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => deletingGO && handleDelete(deletingGO)}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
