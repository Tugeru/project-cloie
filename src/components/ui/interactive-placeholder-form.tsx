"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormFieldOption = {
  label: string;
  value: string;
};

type FormFieldConfig =
  | {
      id: string;
      label: string;
      placeholder?: string;
      type?: "text" | "email" | "number";
      kind: "input";
    }
  | {
      id: string;
      label: string;
      options: FormFieldOption[];
      kind: "select";
    }
  | {
      id: string;
      label: string;
      placeholder?: string;
      kind: "textarea";
    };

type InteractivePlaceholderFormProps = {
  title: string;
  description: string;
  submitLabel?: string;
  successMessage?: string;
  fields: FormFieldConfig[];
};

export function InteractivePlaceholderForm({
  title,
  description,
  submitLabel = "Save Draft",
  successMessage = "Prototype only. Changes were captured in the UI but not persisted.",
  fields,
}: InteractivePlaceholderFormProps) {
  const initialValues = useMemo(
    () =>
      Object.fromEntries(
        fields.map((field) => [
          field.id,
          field.kind === "select" ? (field.options[0]?.value ?? "") : "",
        ])
      ),
    [fields]
  );
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [feedback, setFeedback] = useState<"idle" | "saved">("idle");

  const updateValue = (id: string, nextValue: string) => {
    setValues((previous) => ({ ...previous, [id]: nextValue }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback("saved");
  };

  return (
    <section className="border-border bg-surface rounded-2xl border p-5">
      <div className="mb-4 space-y-1">
        <h2 className="text-text-primary text-lg font-semibold">{title}</h2>
        <p className="text-text-secondary text-sm">{description}</p>
      </div>

      <Alert className="border-warning/40 bg-warning/10 mb-4 text-yellow-900">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Scaffold Mode</AlertTitle>
        <AlertDescription>
          This form is interactive, but it does not write to the database yet.
        </AlertDescription>
      </Alert>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>

            {field.kind === "input" && (
              <Input
                id={field.id}
                placeholder={field.placeholder}
                type={field.type ?? "text"}
                value={values[field.id] ?? ""}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateValue(field.id, event.target.value)
                }
              />
            )}

            {field.kind === "select" && (
              <select
                id={field.id}
                className="border-input h-10 w-full rounded-lg border bg-transparent px-3 text-sm"
                value={values[field.id] ?? ""}
                onChange={(event) => updateValue(field.id, event.target.value)}
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {field.kind === "textarea" && (
              <Textarea
                id={field.id}
                placeholder={field.placeholder}
                value={values[field.id] ?? ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  updateValue(field.id, event.target.value)
                }
              />
            )}
          </div>
        ))}

        <div className="flex flex-wrap gap-3">
          <Button type="submit">{submitLabel}</Button>
          <Button type="button" variant="outline" onClick={() => setValues(initialValues)}>
            Reset
          </Button>
        </div>

        {feedback === "saved" && (
          <Alert className="border-success/40 bg-success/10 text-green-900">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Captured</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
      </form>
    </section>
  );
}
