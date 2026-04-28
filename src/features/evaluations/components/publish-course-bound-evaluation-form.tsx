"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AcademicSemester, AcademicTerm } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/ui/toast";
import { SEMESTER_OPTIONS, TERM_OPTIONS } from "@/lib/constants/academic";
import type {
  PublishCourseBoundEvaluationInput,
  PublishCourseBoundEvaluationResult,
} from "@/features/evaluations/types";

type YearLevelOption = {
  id: string;
  name: string;
  order: number;
};

type InitialSelection = Partial<{
  academicYear: string;
  semester: AcademicSemester;
  term: AcademicTerm;
}>;

type PublicationContext = {
  bindings: Array<{
    ciloDescriptionSnapshot: string;
    ciloId: string;
    itemKey: string;
    questionPromptSnapshot: string;
    sectionKey: string;
  }>;
  cilos: Array<{ description: string; id: string }>;
  course: {
    code: string;
    courseType: string;
    id: string;
    majorId: string | null;
    majorName: string | null;
    programCode: string;
    programId: string | null;
    programName: string;
    scopeLabel: string;
    title: string;
  };
  majorId: string | null;
  programId: string;
  template: {
    id: string;
    name: string;
  };
};

interface PublishCourseBoundEvaluationFormProps {
  initialSelection?: InitialSelection;
  publicationContext: PublicationContext;
  publishAction: (
    payload: PublishCourseBoundEvaluationInput
  ) => Promise<PublishCourseBoundEvaluationResult>;
  yearLevels: YearLevelOption[];
}

export function PublishCourseBoundEvaluationForm({
  initialSelection,
  publicationContext,
  publishAction,
  yearLevels,
}: PublishCourseBoundEvaluationFormProps) {
  const [deploymentName, setDeploymentName] = useState("");
  const [academicYear, setAcademicYear] = useState(initialSelection?.academicYear ?? "");
  const [semester, setSemester] = useState(initialSelection?.semester ?? SEMESTER_OPTIONS[0].value);
  const [term, setTerm] = useState(initialSelection?.term ?? TERM_OPTIONS[0].value);
  const [activationSchedule, setActivationSchedule] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedYearLevelIds, setSelectedYearLevelIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fallbackPublishErrorMessage = "Unable to publish evaluation right now. Please try again.";

  const bindingByCiloId = new Map(
    publicationContext.bindings.map((binding) => [binding.ciloId, binding])
  );

  const handleYearLevelToggle = (yearLevelId: string, checked: boolean) => {
    setSelectedYearLevelIds((previous) => {
      if (checked) {
        if (previous.includes(yearLevelId)) {
          return previous;
        }

        return [...previous, yearLevelId];
      }

      return previous.filter((id) => id !== yearLevelId);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!deploymentName.trim()) {
      const message = "Please provide a deployed evaluation name.";
      setError(message);
      showToast(message, "error");
      return;
    }

    if (!academicYear.trim()) {
      const message = "Please provide an academic year.";
      setError(message);
      showToast(message, "error");
      return;
    }

    if (!/^\d{4}-\d{4}$/.test(academicYear.trim())) {
      const message = "Academic year must be in YYYY-YYYY format (e.g. 2026-2027).";
      setError(message);
      showToast(message, "error");
      return;
    }

    if (selectedYearLevelIds.length === 0) {
      const message = "Please select at least one target year level.";
      setError(message);
      showToast(message, "error");
      return;
    }

    const payload: PublishCourseBoundEvaluationInput = {
      academicYear: academicYear.trim(),
      activationAt: activationSchedule ? new Date(activationSchedule) : null,
      deadlineAt: deadline ? new Date(deadline) : null,
      deploymentName: deploymentName.trim(),
      semester,
      templateId: publicationContext.template.id,
      term,
      yearLevelIds: selectedYearLevelIds,
    };

    setIsSubmitting(true);

    try {
      const result = await publishAction(payload);

      if (!result.success) {
        setError(result.error);
        showToast(result.error, "error");
        return;
      }

      const message = `Evaluation published successfully. ${result.targetCount} target(s), ${result.assignmentCount} assignment(s), status: ${result.status}.`;
      setSuccessMessage(message);
      showToast("Evaluation published successfully.");
    } catch {
      setError(fallbackPublishErrorMessage);
      showToast(fallbackPublishErrorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Publish CILO Evaluation</h1>
        <p className="text-text-muted text-sm">
          Target the right students for this course-bound evaluation. The course context and
          CILO-to-question bindings come from the saved faculty template.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="border-border bg-surface space-y-4 rounded-xl border p-5">
          <div className="space-y-1">
            <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">
              Template
            </p>
            <h2 className="text-text-primary text-lg font-semibold">
              {publicationContext.template.name}
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">
                Program
              </p>
              <p className="text-text-primary text-sm">
                {publicationContext.course.programCode} - {publicationContext.course.programName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">
                Course Scope
              </p>
              <p className="text-text-primary text-sm">{publicationContext.course.scopeLabel}</p>
            </div>
            <div className="space-y-1">
              <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">
                Course
              </p>
              <p className="text-text-primary text-sm">
                {publicationContext.course.code} - {publicationContext.course.title}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">
                Major Context
              </p>
              <p className="text-text-primary text-sm">
                {publicationContext.course.majorName ?? "Shared / not major-specific"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Saved CILO Bindings</h3>
                <p className="text-text-muted text-sm">
                  These bindings were saved in the template builder and will be frozen into the
                  published evaluation.
                </p>
              </div>
              <Button asChild type="button" variant="outline">
                <Link href={`/faculty/tools/${publicationContext.template.id}/edit`}>
                  Edit Template
                </Link>
              </Button>
            </div>

            <ol className="space-y-3">
              {publicationContext.cilos.map((cilo, index) => {
                const binding = bindingByCiloId.get(cilo.id);

                return (
                  <li key={cilo.id} className="border-border rounded-lg border p-4">
                    <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">
                      CILO {index + 1}
                    </p>
                    <p className="text-text-primary mt-2 text-sm">{cilo.description}</p>
                    {binding && (
                      <div className="bg-surface-container-low mt-3 rounded-md p-3">
                        <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">
                          Bound Likert Question
                        </p>
                        <p className="text-text-primary mt-1 text-sm">
                          {binding.questionPromptSnapshot}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <form
          className="border-border bg-surface space-y-6 rounded-xl border p-5"
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <Label htmlFor="deployment-name">Deployed Evaluation Name</Label>
            <Input
              id="deployment-name"
              placeholder="e.g. IT 401 Post-Term CILO Evaluation"
              value={deploymentName}
              onChange={(event) => setDeploymentName(event.target.value)}
            />
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="academic-year">Academic Year</Label>
              <Input
                id="academic-year"
                placeholder="e.g. 2026-2027"
                value={academicYear}
                onChange={(event) => setAcademicYear(event.target.value)}
              />
              <p className="text-text-muted text-xs">
                Must match the academic year stored in student profiles (YYYY-YYYY).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <select
                id="semester"
                className="border-input h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm"
                value={semester}
                onChange={(event) => setSemester(event.target.value as AcademicSemester)}
              >
                {SEMESTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Term</Label>
              <select
                id="term"
                className="border-input h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm"
                value={term}
                onChange={(event) => setTerm(event.target.value as AcademicTerm)}
              >
                {TERM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activation-schedule">Activation Schedule</Label>
              <Input
                id="activation-schedule"
                type="datetime-local"
                value={activationSchedule}
                onChange={(event) => setActivationSchedule(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </div>
          </div>

          <fieldset className="border-border space-y-3 rounded-lg border p-4">
            <legend className="px-1 text-sm font-semibold">Target Year Levels</legend>
            <div className="grid gap-2">
              {yearLevels.map((yearLevel) => (
                <label
                  key={yearLevel.id}
                  className="flex items-center gap-2 text-sm"
                  htmlFor={`year-${yearLevel.id}`}
                >
                  <input
                    id={`year-${yearLevel.id}`}
                    type="checkbox"
                    checked={selectedYearLevelIds.includes(yearLevel.id)}
                    onChange={(event) => handleYearLevelToggle(yearLevel.id, event.target.checked)}
                  />
                  {yearLevel.name}
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p className="text-danger text-sm">{error}</p>}
          {successMessage && <p className="text-success text-sm">{successMessage}</p>}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" disabled={isSubmitting || yearLevels.length === 0}>
              {isSubmitting ? "Publishing..." : "Publish Evaluation"}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/faculty/tools">Back to Tools</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
