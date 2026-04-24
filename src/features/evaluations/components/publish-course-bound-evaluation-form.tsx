"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type {
  FacultyCourseContext,
  FacultyManagedCiloContext,
  FacultyManagedCiloLoadResult,
  PublishCourseBoundEvaluationInput,
  PublishCourseBoundEvaluationResult,
} from "@/features/evaluations/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEMESTER_OPTIONS, TERM_OPTIONS } from "@/lib/constants/academic";

type YearLevelOption = {
  id: string;
  name: string;
  order: number;
};

type InitialSelection = Partial<
  FacultyManagedCiloContext & {
    courseType: FacultyCourseContext["courseType"];
  }
>;

interface PublishCourseBoundEvaluationFormProps {
  courseContexts: FacultyCourseContext[];
  initialSelection?: InitialSelection;
  loadManagedCilosAction: (
    payload: FacultyManagedCiloContext,
  ) => Promise<FacultyManagedCiloLoadResult>;
  publishAction: (
    payload: PublishCourseBoundEvaluationInput,
  ) => Promise<PublishCourseBoundEvaluationResult>;
  yearLevels: YearLevelOption[];
}

function buildEditCilosHref(
  context: FacultyManagedCiloContext,
  courseType: FacultyCourseContext["courseType"],
) {
  const params = new URLSearchParams({
    academicYear: context.academicYear,
    courseId: context.courseId,
    courseType,
    programId: context.programId,
    semester: context.semester,
    term: context.term,
  });

  if (context.majorId) {
    params.set("majorId", context.majorId);
  }

  return `/faculty/cilos?${params.toString()}`;
}

export function PublishCourseBoundEvaluationForm({
  courseContexts,
  initialSelection,
  loadManagedCilosAction,
  publishAction,
  yearLevels,
}: PublishCourseBoundEvaluationFormProps) {
  const [courseType, setCourseType] = useState<FacultyCourseContext["courseType"]>(
    initialSelection?.courseType ?? "PROGRAM_SPECIFIC",
  );
  const [programId, setProgramId] = useState(initialSelection?.programId ?? "");
  const [majorId, setMajorId] = useState(initialSelection?.majorId ?? "");
  const [courseId, setCourseId] = useState(initialSelection?.courseId ?? "");
  const [academicYear, setAcademicYear] = useState(
    initialSelection?.academicYear ?? "",
  );
  const [semester, setSemester] = useState(
    initialSelection?.semester ?? SEMESTER_OPTIONS[0].value,
  );
  const [term, setTerm] = useState(initialSelection?.term ?? TERM_OPTIONS[0].value);
  const [activationSchedule, setActivationSchedule] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedYearLevelIds, setSelectedYearLevelIds] = useState<string[]>([]);
  const [loadedCilos, setLoadedCilos] = useState<Array<{ description: string; id: string }>>(
    [],
  );
  const [ciloError, setCiloError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoadingCilos, setIsLoadingCilos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoLoadRef = useRef(false);

  const fallbackPublishErrorMessage =
    "Unable to publish evaluation right now. Please try again.";

  const programs = useMemo(
    () =>
      [
        ...new Map(
          courseContexts.map((context) => [
            context.programId,
            {
              code: context.programCode,
              id: context.programId,
              name: context.programName,
            },
          ]),
        ).values(),
      ],
    [courseContexts],
  );

  const availableMajors = useMemo(
    () =>
      [
        ...new Map(
          courseContexts
            .filter((context) => context.programId === programId && context.majorId)
            .map((context) => [
              context.majorId,
              { id: context.majorId!, name: context.majorName ?? "Unnamed Major" },
            ]),
        ).values(),
      ],
    [courseContexts, programId],
  );

  const availableCourses = useMemo(
    () =>
      courseContexts.filter((context) => {
        if (context.courseType !== courseType) {
          return false;
        }

        if (context.programId !== programId) {
          return false;
        }

        if (!majorId) {
          return true;
        }

        return context.majorId === null || context.majorId === majorId;
      }),
    [courseContexts, courseType, majorId, programId],
  );

  const selectedCourse =
    availableCourses.find((context) => context.courseId === courseId) ?? null;

  const contextPayload = useMemo<FacultyManagedCiloContext | null>(() => {
    if (!programId || !courseId || !academicYear.trim()) {
      return null;
    }

    return {
      academicYear: academicYear.trim(),
      courseId,
      majorId: majorId || selectedCourse?.majorId || null,
      programId,
      semester,
      term,
    };
  }, [academicYear, courseId, majorId, programId, selectedCourse?.majorId, semester, term]);

  const editCilosHref = contextPayload
    ? buildEditCilosHref(contextPayload, courseType)
    : "/faculty/cilos";

  const hasSavedCilos = loadedCilos.length > 0;

  async function loadSavedCilos() {
    if (!contextPayload) {
      setLoadedCilos([]);
      setCiloError(null);
      return;
    }

    setIsLoadingCilos(true);
    setCiloError(null);

    try {
      const result = await loadManagedCilosAction(contextPayload);

      if (!result.success) {
        setLoadedCilos([]);
        setCiloError(result.error);
        return;
      }

      setLoadedCilos(
        result.items.map((item) => ({
          description: item.description,
          id: item.id,
        })),
      );

      if (result.items.length === 0) {
        setCiloError(
          "No saved CILOs were found for this context. Add them in the CILO workspace before publishing.",
        );
      }
    } catch {
      setLoadedCilos([]);
      setCiloError("Unable to load saved CILOs right now. Please try again.");
    } finally {
      setIsLoadingCilos(false);
    }
  }

  useEffect(() => {
    autoLoadRef.current = false;
  }, [courseType, programId, majorId, courseId, academicYear, semester, term]);

  useEffect(() => {
    setLoadedCilos([]);
    setCiloError(null);

    if (!contextPayload) {
      return;
    }

    if (autoLoadRef.current) {
      return;
    }

    autoLoadRef.current = true;
    void loadSavedCilos();
  }, [contextPayload]);

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

    if (!programId) {
      setError("Please select a program context.");
      return;
    }

    if (!courseId) {
      setError("Please select a course.");
      return;
    }

    if (!academicYear.trim()) {
      setError("Please provide an academic year.");
      return;
    }

    if (selectedYearLevelIds.length === 0) {
      setError("Please select at least one target year level.");
      return;
    }

    if (!hasSavedCilos) {
      setError("This course context must have saved CILOs before you can publish.");
      return;
    }

    const payload: PublishCourseBoundEvaluationInput = {
      academicYear: academicYear.trim(),
      activationAt: activationSchedule ? new Date(activationSchedule) : null,
      cilos: loadedCilos.map((item) => ({
        description: item.description,
      })),
      courseId,
      deadlineAt: deadline ? new Date(deadline) : null,
      majorId: majorId || selectedCourse?.majorId || null,
      programId,
      semester,
      term,
      yearLevelIds: selectedYearLevelIds,
    };

    setIsSubmitting(true);
    try {
      const result = await publishAction(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccessMessage(
        `Evaluation published successfully. ${result.targetCount} target(s), ${result.assignmentCount} assignment(s), status: ${result.status}.`,
      );
    } catch {
      setError(fallbackPublishErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Publish CILO Evaluation</h1>
        <p className="text-sm text-text-muted">
          Review a saved CILO set, choose the target year levels, and publish this
          course-bound evaluation.
        </p>
      </div>

      <form
        className="space-y-6 rounded-xl border border-border bg-surface p-5"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="course-type">Course Type</Label>
            <select
              id="course-type"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={courseType}
              onChange={(event) => {
                setCourseType(event.target.value as FacultyCourseContext["courseType"]);
                setCourseId("");
              }}
            >
              <option value="PROGRAM_SPECIFIC">Program-Specific</option>
              <option value="GENERAL_EDUCATION">General Education</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="program-context">Program Context</Label>
            <select
              id="program-context"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={programId}
              onChange={(event) => {
                setProgramId(event.target.value);
                setMajorId("");
                setCourseId("");
              }}
            >
              <option value="">Select a program context</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.code} - {program.name}
                </option>
              ))}
            </select>
          </div>

          {availableMajors.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="major-context">Major Context</Label>
              <select
                id="major-context"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={majorId}
                onChange={(event) => {
                  setMajorId(event.target.value);
                  setCourseId("");
                }}
              >
                <option value="">All majors / shared courses</option>
                {availableMajors.map((major) => (
                  <option key={major.id} value={major.id}>
                    {major.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="course-context">Course</Label>
            <select
              id="course-context"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
            >
              <option value="">Select a course</option>
              {availableCourses.map((context) => (
                <option
                  key={`${context.programId}-${context.courseId}-${context.majorId ?? "shared"}`}
                  value={context.courseId}
                >
                  {context.courseCode} - {context.courseTitle} ({context.scopeLabel})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="academic-year">Academic Year</Label>
            <Input
              id="academic-year"
              placeholder="e.g. 2026-2027"
              value={academicYear}
              onChange={(event) => setAcademicYear(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="semester">Semester</Label>
            <select
              id="semester"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={semester}
              onChange={(event) => setSemester(event.target.value as typeof semester)}
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
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={term}
              onChange={(event) => setTerm(event.target.value as typeof term)}
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

        <fieldset className="space-y-3 rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-semibold">Target Year Levels</legend>
          <div className="grid gap-2 sm:grid-cols-2">
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
                  onChange={(event) =>
                    handleYearLevelToggle(yearLevel.id, event.target.checked)
                  }
                />
                {yearLevel.name}
              </label>
            ))}
          </div>
        </fieldset>

        <section className="space-y-4 rounded-lg border border-border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Saved CILOs</h2>
              <p className="text-sm text-text-muted">
                This publish flow reads the saved CILO set for the selected course context.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!contextPayload || isLoadingCilos}
                onClick={() => void loadSavedCilos()}
              >
                {isLoadingCilos ? "Refreshing..." : "Refresh Saved CILOs"}
              </Button>
              <Button asChild type="button" variant="secondary">
                <Link href={editCilosHref}>Edit CILOs</Link>
              </Button>
            </div>
          </div>

          {ciloError && <p className="text-sm text-danger">{ciloError}</p>}

          {hasSavedCilos ? (
            <ol className="space-y-3">
              {loadedCilos.map((item, index) => (
                <li key={item.id} className="rounded-lg border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    CILO {index + 1}
                  </p>
                  <p className="mt-2 text-sm text-text-primary">{item.description}</p>
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-5 text-sm text-text-muted">
              Select a full course context to load saved CILOs. Publishing stays blocked
              until this context has at least one saved CILO.
            </div>
          )}
        </section>

        {error && <p className="text-sm text-danger">{error}</p>}
        {successMessage && <p className="text-sm text-success">{successMessage}</p>}

        <Button
          type="submit"
          disabled={
            isSubmitting ||
            courseContexts.length === 0 ||
            yearLevels.length === 0 ||
            !hasSavedCilos
          }
        >
          {isSubmitting ? "Publishing..." : "Publish Evaluation"}
        </Button>
      </form>
    </div>
  );
}
