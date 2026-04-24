"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type MajorFormProps = {
  action: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  programId: string;
  defaultValues?: {
    id?: string;
    name?: string;
  };
  submitLabel?: string;
  onSuccess?: () => void;
};

export function MajorForm({
  action,
  programId,
  defaultValues,
  submitLabel = "Add Major",
  onSuccess,
}: MajorFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await action(formData);
      if (!result.success && result.error) {
        setError(result.error);
      } else if (result.success) {
        formRef.current?.reset();
        onSuccess?.();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex items-end gap-3">
      <input type="hidden" name="program_id" value={programId} />
      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      <div className="flex-1 space-y-1">
        <Label htmlFor={`major-name-${programId}`} className="text-xs">
          Major Name
        </Label>
        <Input
          id={`major-name-${programId}`}
          name="name"
          placeholder="e.g. Financial Management"
          defaultValue={defaultValues?.name}
          required
          maxLength={200}
          className="h-9"
        />
      </div>

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "..." : submitLabel}
      </Button>

      {error && (
        <Alert variant="destructive" className="mt-1">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
