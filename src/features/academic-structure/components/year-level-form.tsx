"use client";

import { useRef, useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type YearLevelFormProps = {
  action: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  defaultValues?: {
    id?: string;
    name?: string;
    order?: number;
  };
  submitLabel?: string;
  onSuccess?: () => void;
};

export function YearLevelForm({
  action,
  defaultValues,
  submitLabel = "Save Year Level",
  onSuccess,
}: YearLevelFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await action(formData);

      if (!result.success) {
        setError(result.error ?? "Unable to save year level.");
        return;
      }

      if (!defaultValues?.id) {
        formRef.current?.reset();
      }

      onSuccess?.();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`year-level-name-${defaultValues?.id ?? "new"}`}>Year Level</Label>
          <Input
            id={`year-level-name-${defaultValues?.id ?? "new"}`}
            name="name"
            placeholder="4th Year"
            defaultValue={defaultValues?.name}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`year-level-order-${defaultValues?.id ?? "new"}`}>Display Order</Label>
          <Input
            id={`year-level-order-${defaultValues?.id ?? "new"}`}
            name="order"
            type="number"
            min={1}
            max={20}
            defaultValue={defaultValues?.order}
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
