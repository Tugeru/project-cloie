"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  FacultyCourseContext,
  FacultyManagedCiloContext,
  FacultyManagedCiloLoadResult,
  FacultyManagedCiloSaveInput,
  FacultyManagedCiloSaveResult,
} from "@/features/evaluations/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SEMESTER_OPTIONS, TERM_OPTIONS } from "@/lib/constants/academic";

type InitialSelection = Partial<
  FacultyManagedCiloContext & {
    courseType: FacultyCourseContext["courseType"];
  }
>;

interface FacultyCiloWorkspaceProps {
  courseContexts: FacultyCourseContext[];
  initialSelection?: InitialSelection;
  loadAction: (
    payload: FacultyManagedCiloContext,
  ) => Promise<FacultyManagedCiloLoadResult>;
  saveAction: (
    payload: FacultyManagedCiloSaveInput,
  ) => Promise<FacultyManagedCiloSaveResult>;
}

function createDraftItem(description = "") {
  return {
    description,
    id: `draft-${Math.random().toString(36).slice(2, 10)}`,
  };
}

function buildContextHref(basePath: string, context: FacultyManagedCiloContext, courseType: string) {
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

  return `${basePath}?${params.toString()}`;
}

export function FacultyCiloWorkspace({
  courseContexts,
  initialSelection,
  loadAction,
  saveAction,
}: FacultyCiloWorkspaceProps) {
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
  const [items, setItems] = useState(() => [createDraftItem()]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const autoLoadRef = useRef(false);

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
              {
                id: context.majorId!,
                name: context.majorName ?? "Unnamed Major",
              },
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

  const publishHref = contextPayload
    ? buildContextHref("/faculty/cilo-evaluations/new", contextPayload, courseType)
    : "/faculty/cilo-evaluations/new";

  function resetLoadedState() {
    setError(null);
    setSuccessMessage(null);
    setIsLoaded(false);
    setItems([createDraftItem()]);
  }

  async function handleLoad() {
    if (!contextPayload) {
      setError("Select a complete course context before loading CILOs.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await loadAction(contextPayload);

      if (!result.success) {
        setError(result.error);
        setIsLoaded(false);
        setItems([createDraftItem()]);
        return;
      }

      setItems(
        result.items.length > 0
          ? result.items.map((item) => ({
              description: item.description,
              id: item.id,
            }))
          : [createDraftItem()],
      );
      setIsLoaded(true);
      setSuccessMessage(
        result.hasSavedCilos
          ? `Loaded ${result.items.length} saved CILO(s) for this course context.`
          : "No saved CILOs were found for this context yet. Start building them below.",
      );
    } catch {
      setError("Unable to load CILOs right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!contextPayload) {
      setError("Select a complete course context before saving CILOs.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await saveAction({
        ...contextPayload,
        items,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setItems(
        result.items.length > 0
          ? result.items.map((item) => ({
              description: item.description,
              id: item.id,
            }))
          : [createDraftItem()],
      );
      setIsLoaded(true);
      setSuccessMessage(
        result.items.length > 0
          ? `Saved ${result.items.length} CILO(s). This course context is ready for publishing.`
          : "Saved an empty CILO set for this course context.",
      );
    } catch {
      setError("Unable to save CILOs right now. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (autoLoadRef.current || !contextPayload || !initialSelection?.academicYear) {
      return;
    }

    autoLoadRef.current = true;
    void handleLoad();
  }, [contextPayload, initialSelection?.academicYear]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Manage CILOs</h1>
        <p className="text-sm text-text-muted">
          Select a scoped course context, load its saved CILOs, then refine the set
          before publishing a course-bound evaluation.
        </p>
      </div>

      <section className="space-y-5 rounded-xl border border-border bg-surface p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="workspace-course-type">Course Type</Label>
            <select
              id="workspace-course-type"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={courseType}
              onChange={(event) => {
                setCourseType(event.target.value as FacultyCourseContext["courseType"]);
                setCourseId("");
                resetLoadedState();
              }}
            >
              <option value="PROGRAM_SPECIFIC">Program-Specific</option>
              <option value="GENERAL_EDUCATION">General Education</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-program">Program Context</Label>
            <select
              id="workspace-program"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={programId}
              onChange={(event) => {
                setProgramId(event.target.value);
                setMajorId("");
                setCourseId("");
                resetLoadedState();
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
              <Label htmlFor="workspace-major">Major Context</Label>
              <select
                id="workspace-major"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={majorId}
                onChange={(event) => {
                  setMajorId(event.target.value);
                  setCourseId("");
                  resetLoadedState();
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
            <Label htmlFor="workspace-course">Course</Label>
            <select
              id="workspace-course"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={courseId}
              onChange={(event) => {
                setCourseId(event.target.value);
                resetLoadedState();
              }}
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
            <Label htmlFor="workspace-academic-year">Academic Year</Label>
            <Input
              id="workspace-academic-year"
              placeholder="e.g. 2026-2027"
              value={academicYear}
              onChange={(event) => {
                setAcademicYear(event.target.value);
                resetLoadedState();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-semester">Semester</Label>
            <select
              id="workspace-semester"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={semester}
              onChange={(event) => {
                setSemester(event.target.value as typeof semester);
                resetLoadedState();
              }}
            >
              {SEMESTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-term">Term</Label>
            <select
              id="workspace-term"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={term}
              onChange={(event) => {
                setTerm(event.target.value as typeof term);
                resetLoadedState();
              }}
            >
              {TERM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={!contextPayload || isLoading}
            onClick={() => void handleLoad()}
          >
            {isLoading ? "Loading..." : "Load Saved CILOs"}
          </Button>

          <Button
            type="button"
            disabled={!contextPayload || isSaving || isLoading}
            onClick={() => void handleSave()}
          >
            {isSaving ? "Saving..." : "Save CILO Set"}
          </Button>

          <Button asChild variant="secondary" disabled={!contextPayload || !isLoaded}>
            <Link href={publishHref}>Go to Publish Flow</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">CILO Workspace</h2>
            <p className="text-sm text-text-muted">
              Load a course context first, then add, edit, reorder, or remove CILOs.
            </p>
          </div>
          {contextPayload && (
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {isLoaded ? "Ready to publish after saving" : "Load context to begin"}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        {successMessage && <p className="text-sm text-success">{successMessage}</p>}

        {!isLoaded ? (
          <div className="rounded-lg border border-dashed border-border p-5 text-sm text-text-muted">
            Select the course context above, then load its saved CILOs to start working.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-text-primary">CILO {index + 1}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={index === 0}
                      onClick={() => {
                        setItems((current) => {
                          const next = [...current];
                          [next[index - 1], next[index]] = [next[index], next[index - 1]];
                          return next;
                        });
                      }}
                    >
                      Move Up
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={index === items.length - 1}
                      onClick={() => {
                        setItems((current) => {
                          const next = [...current];
                          [next[index], next[index + 1]] = [next[index + 1], next[index]];
                          return next;
                        });
                      }}
                    >
                      Move Down
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setItems((current) =>
                          current.length === 1
                            ? [createDraftItem()]
                            : current.filter((entry) => entry.id !== item.id),
                        );
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                <Textarea
                  value={item.description}
                  placeholder="Describe the course-intended learning outcome."
                  onChange={(event) => {
                    const nextDescription = event.target.value;
                    setItems((current) =>
                      current.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, description: nextDescription }
                          : entry,
                      ),
                    );
                  }}
                />
              </div>
            ))}

            <div className="flex flex-wrap gap-3 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setItems((current) => [...current, createDraftItem()])}
              >
                Add Another CILO
              </Button>

              <Button
                type="button"
                disabled={!contextPayload || isSaving}
                onClick={() => void handleSave()}
              >
                {isSaving ? "Saving..." : "Save CILO Set"}
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
