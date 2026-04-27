"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createBaselineTemplateAction,
  toggleBaselineTemplateActiveAction,
  updateBaselineTemplateAction,
} from "@/lib/actions/admin-foundation-actions";

type TemplateItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_faculty_accessible: boolean;
  versions: Array<{
    id: string;
    version_number: number;
  }>;
  _count: {
    versions: number;
  };
};

type TemplateFormProps = {
  action: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  defaultValues?: {
    id?: string;
    code?: string;
    name?: string;
    description?: string | null;
    is_faculty_accessible?: boolean;
  };
  submitLabel?: string;
  onSuccess?: () => void;
};

function TemplateForm({
  action,
  defaultValues,
  submitLabel = "Save Template",
  onSuccess,
}: TemplateFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await action(formData);

      if (!result.success) {
        setError(result.error ?? "Unable to save template.");
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
          <Label htmlFor={`template-code-${defaultValues?.id ?? "new"}`}>Template Code</Label>
          <Input
            id={`template-code-${defaultValues?.id ?? "new"}`}
            name="code"
            placeholder="EXIT_SURVEY"
            defaultValue={defaultValues?.code}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`template-name-${defaultValues?.id ?? "new"}`}>Template Name</Label>
          <Input
            id={`template-name-${defaultValues?.id ?? "new"}`}
            name="name"
            placeholder="Graduating Student Exit Survey"
            defaultValue={defaultValues?.name}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`template-description-${defaultValues?.id ?? "new"}`}>Description</Label>
        <Textarea
          id={`template-description-${defaultValues?.id ?? "new"}`}
          name="description"
          rows={3}
          placeholder="Describe the baseline purpose and governance notes..."
          defaultValue={defaultValues?.description ?? ""}
        />
      </div>

      <label className="border-border flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
        <input
          type="checkbox"
          name="is_faculty_accessible"
          value="true"
          defaultChecked={defaultValues?.is_faculty_accessible ?? false}
        />
        Faculty can access this template as a governed baseline
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

export function AdminTemplateManagement({ templates }: { templates: TemplateItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggleTemplate(id: string, nextActive: boolean) {
    startTransition(async () => {
      const result = await toggleBaselineTemplateActiveAction(id, nextActive);

      if (!result.success) {
        alert(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Baseline Template</CardTitle>
          <CardDescription>
            Register centrally governed templates that Program Heads can later extend or reference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateForm
            action={createBaselineTemplateAction}
            submitLabel="Create Baseline Template"
            onSuccess={() => router.refresh()}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id} className={!template.is_active ? "opacity-75" : ""}>
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.code}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {template.is_faculty_accessible && (
                    <Badge variant="outline">Faculty Access</Badge>
                  )}
                </div>
              </div>
              <div className="text-text-secondary text-xs">
                Latest version: {template.versions[0]?.version_number ?? "N/A"} &bull;{" "}
                {template._count.versions} total version(s)
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <TemplateForm
                action={updateBaselineTemplateAction}
                defaultValues={template}
                submitLabel="Update Template"
                onSuccess={() => router.refresh()}
              />

              <div className="border-border border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleToggleTemplate(template.id, !template.is_active)}
                >
                  {template.is_active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
