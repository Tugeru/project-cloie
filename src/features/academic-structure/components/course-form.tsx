"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { AcademicSemester, AcademicTerm, CourseScope, YearLevel } from "@prisma/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { YEAR_LEVEL_OPTIONS } from "@/lib/constants/year-levels";
import { SEMESTER_OPTIONS, TERM_OPTIONS } from "@/lib/constants/academic";

type ProgramOption = {
  id: string;
  code: string;
  name: string;
};

type MajorOption = {
  id: string;
  name: string;
  program_id: string;
  program_code: string;
};

type CourseFormProps = {
  action: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  programs: ProgramOption[];
  majors: MajorOption[];
  defaultValues?: {
    id?: string;
    code?: string;
    title?: string;
    description?: string | null;
    course_scope?: CourseScope;
    program_id?: string | null;
    major_id?: string | null;
    default_year_level?: YearLevel | null;
    default_semester?: AcademicSemester | null;
    default_term?: AcademicTerm | null;
  };
  submitLabel?: string;
  onSuccess?: () => void;
};

export function CourseForm({
  action,
  programs,
  majors,
  defaultValues,
  submitLabel = "Save Course",
  onSuccess,
}: CourseFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<CourseScope>(
    defaultValues?.course_scope ?? CourseScope.PROGRAM_SPECIFIC
  );
  const [programId, setProgramId] = useState(defaultValues?.program_id ?? "");
  const [yearLevel, setYearLevel] = useState<YearLevel | "">(
    defaultValues?.default_year_level ?? ""
  );
  const [semester, setSemester] = useState<AcademicSemester | "">(
    defaultValues?.default_semester ?? ""
  );
  const [term, setTerm] = useState<AcademicTerm | "">(
    defaultValues?.default_semester === AcademicSemester.SUMMER
      ? ""
      : (defaultValues?.default_term ?? "")
  );

  const isSummer = semester === AcademicSemester.SUMMER;

  const filteredMajors = useMemo(() => {
    if (!programId) {
      return majors;
    }

    return majors.filter((major) => major.program_id === programId);
  }, [majors, programId]);

  async function handleSubmit(formData: FormData) {
    setError(null);
    
    // Wait one tick to ensure state is flushed (React batching issue with form submissions)
    await Promise.resolve();
    
    formData.set("default_year_level", yearLevel);
    formData.set("default_semester", semester);
    formData.set("default_term", isSummer ? "" : term);

    startTransition(async () => {
      const result = await action(formData);

      if (!result.success) {
        setError(result.error ?? "Unable to save course.");
        return;
      }

      if (!defaultValues?.id) {
        setYearLevel("");
        setSemester("");
        setTerm("");
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
          <Label htmlFor={`course-code-${defaultValues?.id ?? "new"}`}>Course Code</Label>
          <Input
            id={`course-code-${defaultValues?.id ?? "new"}`}
            name="code"
            placeholder="IT101"
            defaultValue={defaultValues?.code}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`course-title-${defaultValues?.id ?? "new"}`}>Course Title</Label>
          <Input
            id={`course-title-${defaultValues?.id ?? "new"}`}
            name="title"
            placeholder="Introduction to Computing"
            defaultValue={defaultValues?.title}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`course-description-${defaultValues?.id ?? "new"}`}>Description</Label>
        <Textarea
          id={`course-description-${defaultValues?.id ?? "new"}`}
          name="description"
          rows={3}
          placeholder="Course notes, scope, or governance context..."
          defaultValue={defaultValues?.description ?? ""}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`course-scope-${defaultValues?.id ?? "new"}`}>Course Scope</Label>
          <select
            id={`course-scope-${defaultValues?.id ?? "new"}`}
            name="course_scope"
            className="border-input h-10 w-full rounded-lg border bg-transparent px-3 text-sm"
            value={scope}
            onChange={(event) => {
              const nextScope = event.target.value as CourseScope;
              setScope(nextScope);
              if (nextScope === CourseScope.GENERAL_EDUCATION) {
                setProgramId("");
              }
            }}
          >
            <option value={CourseScope.GENERAL_EDUCATION}>General Education</option>
            <option value={CourseScope.PROGRAM_SPECIFIC}>Program-Specific</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`course-program-${defaultValues?.id ?? "new"}`}>Program</Label>
          <select
            id={`course-program-${defaultValues?.id ?? "new"}`}
            name="program_id"
            className="border-input h-10 w-full rounded-lg border bg-transparent px-3 text-sm disabled:opacity-60"
            value={programId}
            onChange={(event) => setProgramId(event.target.value)}
            disabled={scope === CourseScope.GENERAL_EDUCATION}
          >
            <option value="">No program</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.code} - {program.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`course-major-${defaultValues?.id ?? "new"}`}>Major</Label>
          <select
            id={`course-major-${defaultValues?.id ?? "new"}`}
            name="major_id"
            className="border-input h-10 w-full rounded-lg border bg-transparent px-3 text-sm disabled:opacity-60"
            defaultValue={defaultValues?.major_id ?? ""}
            disabled={scope === CourseScope.GENERAL_EDUCATION || !programId}
          >
            <option value="">Program-wide / none</option>
            {filteredMajors.map((major) => (
              <option key={major.id} value={major.id}>
                {major.program_code} - {major.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-border-muted bg-surface-alt grid gap-4 rounded-lg border p-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`year-level-${defaultValues?.id ?? "new"}`}>
            Year Level <span className="text-text-muted text-xs font-normal">(default)</span>
          </Label>
          <select
            id={`year-level-${defaultValues?.id ?? "new"}`}
            value={yearLevel}
            onChange={(e) => setYearLevel(e.target.value as YearLevel)}
            className="border-input h-10 w-full rounded-lg border bg-transparent px-3 text-sm"
          >
            <option value="">None</option>
            {YEAR_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`semester-${defaultValues?.id ?? "new"}`}>
            Semester <span className="text-text-muted text-xs font-normal">(default)</span>
          </Label>
          <select
            id={`semester-${defaultValues?.id ?? "new"}`}
            value={semester}
            onChange={(e) => {
              const nextSemester = e.target.value as AcademicSemester;
              setSemester(nextSemester);
              if (nextSemester === AcademicSemester.SUMMER) {
                setTerm("");
              }
            }}
            className="border-input h-10 w-full rounded-lg border bg-transparent px-3 text-sm"
          >
            <option value="">None</option>
            {SEMESTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`term-${defaultValues?.id ?? "new"}`}>
            Term <span className="text-text-muted text-xs font-normal">(default)</span>
          </Label>
          <select
            id={`term-${defaultValues?.id ?? "new"}`}
            value={isSummer ? "" : term}
            onChange={(e) => setTerm(e.target.value as AcademicTerm)}
            disabled={isSummer}
            className="border-input h-10 w-full rounded-lg border bg-transparent px-3 text-sm disabled:opacity-60"
          >
            {isSummer ? (
              <option value="">N/A</option>
            ) : (
              <>
                <option value="">Select term</option>
                <option value={AcademicTerm.FIRST_TERM}>1st Term</option>
                <option value={AcademicTerm.SECOND_TERM}>2nd Term</option>
              </>
            )}
          </select>
          {isSummer && (
            <p className="text-muted-foreground text-xs">Summer semester has no terms</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
