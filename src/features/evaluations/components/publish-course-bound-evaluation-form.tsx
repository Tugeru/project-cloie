"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AcademicSemester, AcademicTerm, CourseScope, YearLevel } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/ui/toast";
import { SEMESTER_OPTIONS, TERM_OPTIONS } from "@/lib/constants/academic";
import type {
  PreviewCourseBoundRespondentsInput,
  PreviewCourseBoundRespondentsResult,
  PreviewRespondent,
  PublishCourseBoundEvaluationInput,
  PublishCourseBoundEvaluationResult,
  StudentSection,
} from "@/features/evaluations/types";
import type { TemplateStructure } from "@/features/instruments/types";

type ProgramOption = {
  id: string;
  code: string;
  name: string;
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
    courseType: CourseScope;
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
    structure: TemplateStructure;
  };
};

type Step = "configure" | "preview";

const SECTION_OPTIONS: { label: string; value: StudentSection | null }[] = [
  { label: "None / Not specified", value: null },
  { label: "Morning", value: "MORNING" },
  { label: "Afternoon", value: "AFTERNOON" },
  { label: "Evening", value: "EVENING" },
];

interface PublishCourseBoundEvaluationFormProps {
  availablePrograms?: ProgramOption[]; // For GE courses - all programs
  initialSelection?: InitialSelection;
  previewAction: (
    payload: PreviewCourseBoundRespondentsInput
  ) => Promise<PreviewCourseBoundRespondentsResult>;
  publicationContext: PublicationContext;
  publishAction: (
    payload: PublishCourseBoundEvaluationInput
  ) => Promise<PublishCourseBoundEvaluationResult>;
  yearLevels: YearLevel[];
}

export function PublishCourseBoundEvaluationForm({
  availablePrograms,
  initialSelection,
  previewAction,
  publicationContext,
  publishAction,
  yearLevels,
}: PublishCourseBoundEvaluationFormProps) {
  // Determine available programs based on course scope (must be before useState so we can
  // seed selectedProgramIds with the non-GE course's program without an extra effect)
  const isGeneralEducation = publicationContext.course.courseType === CourseScope.GENERAL_EDUCATION;
  const effectiveAvailablePrograms = isGeneralEducation
    ? (availablePrograms ?? [])
    : publicationContext.course.programId
      ? [{ id: publicationContext.course.programId, code: publicationContext.course.programCode, name: publicationContext.course.programName }]
      : [];

  // Step state
  const [step, setStep] = useState<Step>("configure");

  // Form fields
  const [deploymentName, setDeploymentName] = useState("");
  const [academicYear, setAcademicYear] = useState(initialSelection?.academicYear ?? "");
  const [semester, setSemester] = useState(initialSelection?.semester ?? SEMESTER_OPTIONS[0].value);
  const [term, setTerm] = useState(initialSelection?.term ?? TERM_OPTIONS[0].value);
  const [activationSchedule, setActivationSchedule] = useState("");
  const [deadline, setDeadline] = useState("");
  const [section, setSection] = useState<StudentSection | null>(null);

  // Targeting - changed from multi-year-level to single year level + multi-program.
  // For non-GE courses the program is fixed, so pre-select it to avoid blocking the form.
  const [selectedYearLevel, setSelectedYearLevel] = useState<YearLevel | "">("");
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>(
    isGeneralEducation ? [] : effectiveAvailablePrograms.map((p) => p.id)
  );

  // Preview state
  const [previewRespondents, setPreviewRespondents] = useState<PreviewRespondent[]>([]);
  const [excludedRespondentIds, setExcludedRespondentIds] = useState<string[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Status
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const fallbackPublishErrorMessage = "Unable to publish evaluation right now. Please try again.";

  const bindingByCiloId = new Map(
    publicationContext.bindings.map((binding) => [binding.ciloId, binding])
  );

  // Build a lookup from sectionKey:itemKey → { sectionIndex, sectionTitle, questionIndex }
  const questionLocationMap = new Map<
    string,
    { sectionIndex: number; sectionTitle: string; questionIndex: number }
  >();
  for (const [sIdx, section] of publicationContext.template.structure.entries()) {
    for (const [qIdx, question] of section.questions.entries()) {
      questionLocationMap.set(`${section.key}:${question.key}`, {
        sectionIndex: sIdx + 1,
        sectionTitle: section.title,
        questionIndex: qIdx + 1,
      });
    }
  }

  const handleProgramToggle = (programId: string, checked: boolean) => {
    setSelectedProgramIds((previous) => {
      if (checked) {
        if (previous.includes(programId)) return previous;
        return [...previous, programId];
      }
      return previous.filter((id) => id !== programId);
    });
  };

  const handleExcludeRespondent = (userId: string, excluded: boolean) => {
    setExcludedRespondentIds((previous) => {
      if (excluded) {
        if (previous.includes(userId)) return previous;
        return [...previous, userId];
      }
      return previous.filter((id) => id !== userId);
    });
  };

  const validateConfiguration = (): boolean => {
    if (!deploymentName.trim()) {
      const message = "Please provide a deployed evaluation name.";
      setError(message);
      showToast(message, "error");
      return false;
    }

    if (!academicYear.trim()) {
      const message = "Please provide an academic year.";
      setError(message);
      showToast(message, "error");
      return false;
    }

    if (!/^\d{4}-\d{4}$/.test(academicYear.trim())) {
      const message = "Academic year must be in YYYY-YYYY format (e.g. 2026-2027).";
      setError(message);
      showToast(message, "error");
      return false;
    }

    if (!selectedYearLevel) {
      const message = "Please select a target year level.";
      setError(message);
      showToast(message, "error");
      return false;
    }

    if (selectedProgramIds.length === 0) {
      const message = "Please select at least one target program.";
      setError(message);
      showToast(message, "error");
      return false;
    }

    return true;
  };

  const handlePreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!validateConfiguration()) return;

    setIsLoadingPreview(true);

    try {
      const result = await previewAction({
        assignmentId: "",
      });

      if (!result.success) {
        setError(result.error);
        showToast(result.error, "error");
        return;
      }

      setPreviewRespondents(result.data);
      setExcludedRespondentIds([]);
      setStep("preview");
    } catch {
      setError("Unable to load respondent preview. Please try again.");
      showToast("Unable to load respondent preview. Please try again.", "error");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handlePublishFinal = async () => {
    setError(null);
    setIsSubmitting(true);

    // Calculate final respondent list (excluding unchecked respondents)
    const finalRespondentIds = previewRespondents
      .filter((r) => !excludedRespondentIds.includes(r.userId))
      .map((r) => r.userId);

    const payload: PublishCourseBoundEvaluationInput = {
      assignmentId: "",
      activationAt: activationSchedule ? new Date(activationSchedule) : null,
      deadlineAt: deadline ? new Date(deadline) : null,
      deploymentName: deploymentName.trim(),
      respondentIds: finalRespondentIds,
      templateId: publicationContext.template.id,
    };

    try {
      const result = await publishAction(payload);

      if (!result.success) {
        setError(result.error);
        showToast(result.error, "error");
        return;
      }

      const toastMessage = `Evaluation published successfully! ${result.data.assignmentCount} assignment(s) created.`;
      router.push(`/faculty/tools?toast=${encodeURIComponent(toastMessage)}`);
      return;
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
                    {binding && (() => {
                      const location = questionLocationMap.get(
                        `${binding.sectionKey}:${binding.itemKey}`
                      );
                      return (
                        <div className="bg-surface-container-low mt-3 rounded-md p-3">
                          <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">
                            {location
                              ? `Section ${location.sectionIndex}: ${location.sectionTitle} · Question ${location.questionIndex}`
                              : "Bound Likert Question"}
                          </p>
                          <p className="text-text-primary mt-1 text-sm">
                            {binding.questionPromptSnapshot}
                          </p>
                        </div>
                      );
                    })()}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <form
          className="border-border bg-surface space-y-6 rounded-xl border p-5"
          onSubmit={handlePreview}
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
              <Label htmlFor="section">Section</Label>
              <select
                id="section"
                className="border-input h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm"
                value={section ?? ""}
                onChange={(event) => setSection(event.target.value as StudentSection | null || null)}
              >
                {SECTION_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value ?? ""}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-text-muted text-xs">
                Select the class section this evaluation is for. Different sections can have separate evaluations.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activation-schedule">Activation Schedule (Optional)</Label>
              <Input
                id="activation-schedule"
                type="datetime-local"
                value={activationSchedule}
                onChange={(event) => setActivationSchedule(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </div>
          </div>

          <div className="border-border space-y-2 rounded-lg border p-4">
            <Label htmlFor="year-level">Target Year Level</Label>
            <select
              id="year-level"
              className="border-input h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm"
              value={selectedYearLevel}
              onChange={(event) => setSelectedYearLevel(event.target.value as YearLevel)}
            >
              <option value="">Select a year level...</option>
              {yearLevels.map((yearLevel) => (
                <option key={yearLevel} value={yearLevel}>
                  {yearLevel.replace("_", " ").replace(/\\d/, (m) => m + "th")}
                </option>
              ))}
            </select>
          </div>

          {effectiveAvailablePrograms.length > 0 && (
            <fieldset className="border-border space-y-3 rounded-lg border p-4">
              <legend className="px-1 text-sm font-semibold">
                Target Programs {isGeneralEducation ? "(Multi-select for GE)" : ""}
              </legend>
              <div className="grid gap-2">
                {effectiveAvailablePrograms.map((program) => (
                  <label
                    key={program.id}
                    className="flex items-center gap-2 text-sm"
                    htmlFor={`program-${program.id}`}
                  >
                    <input
                      id={`program-${program.id}`}
                      type="checkbox"
                      checked={selectedProgramIds.includes(program.id)}
                      onChange={(event) => handleProgramToggle(program.id, event.target.checked)}
                    />
                    {program.code} - {program.name}
                  </label>
                ))}
              </div>
              {isGeneralEducation && (
                <p className="text-text-muted text-xs">
                  For General Education courses, select all programs that have students in this class.
                </p>
              )}
            </fieldset>
          )}

          {error && <p className="text-danger text-sm">{error}</p>}

          {step === "configure" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={isLoadingPreview || yearLevels.length === 0}>
                {isLoadingPreview ? "Loading preview..." : "Preview Respondents"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/faculty/tools">Back to Tools</Link>
              </Button>
            </div>
          )}
        </form>

        {step === "preview" && (
          <section className="border-border bg-surface space-y-4 rounded-xl border p-5 lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Step 2: Confirm Respondents</h3>
                <p className="text-text-muted text-sm">
                  Review the matched students. Uncheck any students you want to exclude from this
                  evaluation.
                </p>
              </div>
              <p className="text-sm font-semibold">
                {previewRespondents.length - excludedRespondentIds.length} of {previewRespondents.length} included
              </p>
            </div>

            {previewRespondents.length === 0 ? (
              <p className="text-text-muted text-sm">
                No matching students found for the selected criteria. Please go back and adjust
                your targeting.
              </p>
            ) : (
              <div className="border-border max-h-96 overflow-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-surface-container-low sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Include</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Program</th>
                      <th className="px-3 py-2 text-left">Year</th>
                      <th className="px-3 py-2 text-left">Section</th>
                      <th className="px-3 py-2 text-left">Student ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRespondents.map((respondent) => {
                      const isExcluded = excludedRespondentIds.includes(respondent.userId);
                      return (
                        <tr key={respondent.userId} className="border-border border-t">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={!isExcluded}
                              onChange={(event) =>
                                handleExcludeRespondent(respondent.userId, !event.target.checked)
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            {respondent.lastName}, {respondent.firstName}
                          </td>
                          <td className="px-3 py-2">{respondent.email}</td>
                          <td className="px-3 py-2">{respondent.programCode}</td>
                          <td className="px-3 py-2">{respondent.yearLevel}</td>
                          <td className="px-3 py-2">{respondent.section ?? "—"}</td>
                          <td className="px-3 py-2">{respondent.studentId ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={handlePublishFinal}
                disabled={isSubmitting || previewRespondents.length === 0 || previewRespondents.length === excludedRespondentIds.length}
              >
                {isSubmitting ? "Publishing..." : "Confirm and Publish"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("configure");
                  setError(null);
                }}
                disabled={isSubmitting}
              >
                Back to Configuration
              </Button>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
