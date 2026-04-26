"use client";

import { useState, useRef, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEMESTER_OPTIONS } from "@/lib/constants/academic";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActionResult =
  | { success: true; deploymentId: string; assignmentCount: number; status: string }
  | { success: false; error: string };

interface PublishCentralDeploymentFormProps {
  templates: Array<{ id: string; name: string; code: string }>;
  yearLevels: Array<{ id: string; name: string }>;
  majors: Array<{ id: string; name: string }>;
  programLabel: string;
  preselectedTemplateId?: string;
  publishAction: (formData: FormData) => Promise<ActionResult>;
}

// ─── Stakeholder Options ─────────────────────────────────────────────────────

const STAKEHOLDER_OPTIONS = [
  { value: "STUDENT", label: "Students" },
  { value: "ALUMNI", label: "Alumni" },
  { value: "INDUSTRY_PARTNER", label: "Industry Partners" },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function PublishCentralDeploymentForm({
  templates,
  yearLevels,
  majors,
  programLabel,
  preselectedTemplateId,
  publishAction,
}: PublishCentralDeploymentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    preselectedTemplateId ?? "",
  );
  const [targetStakeholder, setTargetStakeholder] = useState<string>(
    "STUDENT",
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const showYearLevel = targetStakeholder === "STUDENT";
  const showMajor = majors.length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!selectedTemplateId) {
      setError("Please select a template to deploy.");
      return;
    }

    const formData = new FormData(event.currentTarget);

    setIsSubmitting(true);

    try {
      const result = await publishAction(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccessMessage(
        `Deployment published successfully! ${result.assignmentCount} assignment(s) created. Status: ${result.status}.`,
      );
    } catch {
      setError("Unable to publish deployment right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-heading-lg">Publish Evaluation Tool</h1>
        <p className="text-body-md text-text-secondary">
          Deploy an evaluation instrument to target stakeholders within{" "}
          <span className="font-semibold">{programLabel}</span>.
        </p>
      </div>

      {/* Form card */}
      <form
        ref={formRef}
        className="space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="space-y-2">
          <Label htmlFor="deployment_name">Deployed Evaluation Name</Label>
          <Input
            id="deployment_name"
            name="deployment_name"
            placeholder="e.g. BSIT Exit Survey 2026"
            required
          />
          <p className="text-xs text-text-secondary">
            This is the name respondents and reviewers will see for this publication.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="template_id">Evaluation Template</Label>
          {preselectedTemplateId && selectedTemplate ? (
            <>
              <Input
                readOnly
                value={`${selectedTemplate.code} — ${selectedTemplate.name}`}
                className="bg-surface-container-low"
              />
              <input
                type="hidden"
                name="template_id"
                value={selectedTemplateId}
              />
            </>
          ) : (
            <select
              id="template_id"
              name="template_id"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              required
            >
              <option value="">Select a template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} — {t.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Two-column grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left column — Deployment Schedule */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h2 className="text-label-lg font-semibold uppercase tracking-wide">
                Deployment Schedule
              </h2>
            </div>

            {/* Activation Date + Time */}
            <div className="space-y-2">
              <Label>Activation Date & Time</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  name="activation_date"
                  placeholder="Date"
                />
                <Input
                  type="time"
                  name="activation_time"
                  placeholder="Time"
                />
              </div>
              <p className="text-xs text-text-secondary">
                Leave empty to activate immediately upon publication.
              </p>
            </div>

            {/* Deadline Date + Time */}
            <div className="space-y-2">
              <Label>Deadline Date & Time</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  name="deadline_date"
                  placeholder="Date"
                />
                <Input
                  type="time"
                  name="deadline_time"
                  placeholder="Time"
                />
              </div>
              <p className="text-xs text-text-secondary">
                Optional. Respondents cannot submit after this deadline.
              </p>
            </div>
          </div>

          {/* Right column — Audience Targeting */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h2 className="text-label-lg font-semibold uppercase tracking-wide">
                Audience Targeting
              </h2>
            </div>

            {/* Academic Context */}
            <div className="space-y-2">
              <Label htmlFor="academic_year">Academic Year</Label>
              <Input
                id="academic_year"
                name="academic_year"
                placeholder="e.g. 2025-2026"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <select
                id="semester"
                name="semester"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                required
              >
                {SEMESTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Stakeholder */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium leading-none">
                Target Stakeholder
              </legend>
              <div className="space-y-2">
                {STAKEHOLDER_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="target_stakeholder"
                      value={option.value}
                      checked={targetStakeholder === option.value}
                      onChange={() => setTargetStakeholder(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Year Level is required for student-targeted deployments. */}
            {showYearLevel && yearLevels.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="year_level_id">Year Level</Label>
                <select
                  id="year_level_id"
                  name="year_level_id"
                  required={showYearLevel}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  <option value="">Select year level</option>
                  {yearLevels.map((yl) => (
                    <option key={yl.id} value={yl.id}>
                      {yl.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Major — conditional on program having majors */}
            {showMajor && (
              <div className="space-y-2">
                <Label htmlFor="major_id">Major</Label>
                <select
                  id="major_id"
                  name="major_id"
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  <option value="">All majors</option>
                  {majors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        {successMessage && (
          <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
            {successMessage}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <a
            href="/program-head/tools"
            className="text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            Cancel
          </a>
          <Button
            type="submit"
            disabled={isSubmitting || templates.length === 0}
            className="bg-primary text-on-primary"
          >
            {isSubmitting ? (
              "Publishing..."
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                Confirm Publication
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
