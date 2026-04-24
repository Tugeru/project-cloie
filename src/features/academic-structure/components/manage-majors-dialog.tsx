"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Power, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  createMajorAction,
  toggleMajorActiveAction,
  deleteMajorAction,
} from "@/lib/actions/admin-program-actions";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type ManageMajorsDialogProps = {
  program: { id: string; code: string; name: string };
  majors: Array<{ id: string; name: string; is_active: boolean }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ManageMajorsDialog({
  program,
  majors,
  open,
  onOpenChange,
}: ManageMajorsDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ---- Add major handler --------------------------------------------------
  function handleAddMajor(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createMajorAction(formData);
      if (!result.success) {
        setError(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  }

  // ---- Toggle active handler ----------------------------------------------
  function handleToggleActive(majorId: string, currentActive: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleMajorActiveAction(majorId, !currentActive);
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  // ---- Delete handler -----------------------------------------------------
  function handleDelete(majorId: string) {
    setError(null);
    setConfirmDeleteId(null);
    startTransition(async () => {
      const result = await deleteMajorAction(majorId);
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Majors — {program.code}</DialogTitle>
          <DialogDescription>
            Add, toggle, or remove majors for {program.name}.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Existing majors list */}
        <div className="space-y-2">
          {majors.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No majors yet. Add one below.
            </p>
          ) : (
            <ul className="divide-y">
              {majors.map((major) => (
                <li
                  key={major.id}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{major.name}</span>
                    <Badge variant={major.is_active ? "default" : "secondary"}>
                      {major.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Toggle active/inactive */}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      onClick={() => handleToggleActive(major.id, major.is_active)}
                      title={major.is_active ? "Deactivate" : "Activate"}
                    >
                      <Power className="size-3.5" />
                      <span className="sr-only">
                        {major.is_active ? "Deactivate" : "Activate"}
                      </span>
                    </Button>

                    {/* Delete with confirmation */}
                    {confirmDeleteId === major.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleDelete(major.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isPending}
                        onClick={() => setConfirmDeleteId(major.id)}
                        title="Delete major"
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add major form */}
        <form
          ref={formRef}
          action={handleAddMajor}
          className="flex items-end gap-2 border-t pt-3"
        >
          <input type="hidden" name="program_id" value={program.id} />
          <div className="flex-1">
            <Input
              name="name"
              placeholder="New major name..."
              required
              maxLength={200}
              disabled={isPending}
            />
          </div>
          <Button type="submit" size="sm" disabled={isPending}>
            <Plus className="mr-1 size-3.5" />
            {isPending ? "Adding..." : "Add Major"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
