"use client";

import { useState, useEffect, useRef } from "react";
import { YearLevel, StudentSection } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showToast } from "@/components/ui/toast";
import { UserIcon, CheckIcon } from "lucide-react";
import { TermInstancePicker } from "@/features/academic-calendar/components/term-instance-picker";
import { ClassIdentityFields } from "./shared/class-identity-fields";
import { FacultySearchPopover } from "./shared/faculty-search-popover";
import { createCourseAssignmentAction } from "@/lib/actions/course-assignment-actions";
import type { FacultySearchResult } from "@/features/course-assignments/types";
import type { TermInstanceItem } from "@/features/academic-calendar/types";
import { getYearLevelDisplay } from "@/lib/constants/year-levels";
import { STUDENT_SECTION_OPTIONS } from "@/lib/constants/academic";

interface Course {
  id: string;
  code: string;
  title: string;
  default_year_level?: YearLevel | null;
}

interface Program {
  id: string;
  code: string;
  name: string;
}

interface CourseAssignmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableCourses: Course[];
  availablePrograms: Program[];
  termInstances: TermInstanceItem[];
  defaultTermInstanceId?: string | null;
  defaultCourseId?: string | null;
  onSuccess?: () => void;
}

type Step = "term" | "course" | "class" | "faculty" | "confirm";

export function CourseAssignmentFormDialog({
  open,
  onOpenChange,
  availableCourses,
  availablePrograms,
  termInstances,
  defaultTermInstanceId,
  defaultCourseId,
  onSuccess,
}: CourseAssignmentFormDialogProps) {
  const [step, setStep] = useState<Step>(defaultTermInstanceId ? "course" : "term");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [termInstanceId, setTermInstanceId] = useState<string | null>(defaultTermInstanceId ?? null);
  const [courseId, setCourseId] = useState<string | null>(defaultCourseId ?? null);
  const [programId, setProgramId] = useState<string>(availablePrograms[0]?.id ?? "");
  const [yearLevel, setYearLevel] = useState<YearLevel>(YearLevel.FIRST_YEAR);
  const [section, setSection] = useState<StudentSection>(StudentSection.MORNING);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultySearchResult | null>(null);
  const [showCrossProgramWarning, setShowCrossProgramWarning] = useState(false);
  const [hasTouchedYearLevel, setHasTouchedYearLevel] = useState(false);

  const previousCourseId = useRef<string | null>(null);

  const selectedCourse = availableCourses.find((c) => c.id === courseId);
  const selectedProgram = availablePrograms.find((p) => p.id === programId);

  // Pre-fill year level from course default when course changes (only if user hasn't touched it)
  useEffect(() => {
    if (courseId && courseId !== previousCourseId.current && !hasTouchedYearLevel) {
      const course = availableCourses.find((c) => c.id === courseId);
      if (course?.default_year_level) {
        setYearLevel(course.default_year_level);
      }
    }
    previousCourseId.current = courseId;
  }, [courseId, hasTouchedYearLevel, availableCourses]);
  // Note: setYearLevel in effect is safe - guarded by hasTouchedYearLevel and course existence checks

  const handleYearLevelChange = (value: YearLevel) => {
    setHasTouchedYearLevel(true);
    setYearLevel(value);
  };

  const handleNext = () => {
    if (step === "term") setStep("course");
    else if (step === "course") setStep("class");
    else if (step === "class") setStep("faculty");
    else if (step === "faculty") {
      // Check for cross-program assignment
      if (
        selectedFaculty &&
        selectedProgram &&
        !selectedFaculty.affiliations.includes(selectedProgram.name)
      ) {
        setShowCrossProgramWarning(true);
        setStep("confirm");
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (step === "course") setStep("term");
    else if (step === "class") setStep("course");
    else if (step === "faculty") setStep("class");
    else if (step === "confirm") {
      setShowCrossProgramWarning(false);
      setStep("faculty");
    }
  };

  const handleSubmit = async () => {
    if (!termInstanceId || !courseId || !programId || !selectedFaculty) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setIsSubmitting(true);

    const result = await createCourseAssignmentAction({
      termInstanceId,
      facultyId: selectedFaculty.id,
      courseId,
      programId,
      yearLevel,
      section,
    });

    setIsSubmitting(false);

    if (result.success) {
      showToast("Course assignment created successfully.", "success");
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } else {
      showToast(result.error || "Failed to create assignment.", "error");
    }
  };

  const resetForm = () => {
    setStep(defaultTermInstanceId ? "course" : "term");
    setTermInstanceId(defaultTermInstanceId ?? null);
    setCourseId(defaultCourseId ?? null);
    setProgramId(availablePrograms[0]?.id ?? "");
    setYearLevel(YearLevel.FIRST_YEAR);
    setSection(StudentSection.MORNING);
    setSelectedFaculty(null);
    setShowCrossProgramWarning(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const canProceed = () => {
    switch (step) {
      case "term":
        return !!termInstanceId;
      case "course":
        return !!courseId;
      case "class":
        return !!programId && !!section;
      case "faculty":
        return !!selectedFaculty;
      case "confirm":
        return true;
    }
  };

  const STEPS: { key: Step; label: string }[] = [
    { key: "term", label: "Term" },
    { key: "course", label: "Course" },
    { key: "class", label: "Class" },
    { key: "faculty", label: "Faculty" },
    { key: "confirm", label: "Confirm" },
  ];

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign Faculty to Course</DialogTitle>
        </DialogHeader>

        {/* Step progress bar */}
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const isCompleted = i < currentStepIndex;
            const isActive = i === currentStepIndex;
            return (
              <div key={s.key} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? "1" : "0 0 auto" }}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={[
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                        : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {isCompleted ? <CheckIcon className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
                  </div>
                  <span
                    className={[
                      "text-[10px] font-medium leading-none",
                      isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={[
                      "mx-1 mb-4 h-px flex-1 transition-colors",
                      i < currentStepIndex ? "bg-primary" : "bg-border",
                    ].join(" ")}
                  />
                )}
              </div>
            );
          })}
        </div>

        {step === "term" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Academic Term</Label>
              <TermInstancePicker
                termInstances={termInstances}
                value={termInstanceId ?? ""}
                onChange={(val) => setTermInstanceId(val || null)}
              />
            </div>
          </div>
        )}

        {step === "course" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select
                value={courseId ?? ""}
                onValueChange={(value) => value && setCourseId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course...">
                    {courseId
                      ? (() => {
                          const c = availableCourses.find((c) => c.id === courseId);
                          return c ? `${c.code} — ${c.title}` : null;
                        })()
                      : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} — {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === "class" && (
          <div className="space-y-4">
            <ClassIdentityFields
              programId={programId}
              yearLevel={yearLevel}
              section={section}
              availablePrograms={availablePrograms}
              onProgramChange={setProgramId}
              onYearLevelChange={handleYearLevelChange}
              onSectionChange={(value) => value && setSection(value)}
              suggestedYearLevel={selectedCourse?.default_year_level ?? null}
            />
          </div>
        )}

        {step === "faculty" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Faculty</Label>
              <FacultySearchPopover
                selectedFacultyId={selectedFaculty?.id ?? null}
                selectedFacultyName={
                  selectedFaculty
                    ? `${selectedFaculty.firstName} ${selectedFaculty.lastName}`
                    : null
                }
                targetProgramId={programId}
                targetProgramName={selectedProgram?.name}
                onSelect={setSelectedFaculty}
              />
            </div>

            {selectedFaculty && (
              <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <UserIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium leading-snug">
                    {selectedFaculty.firstName} {selectedFaculty.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedFaculty.email}</p>
                  {selectedFaculty.primaryAffiliation && (
                    <p className="text-xs text-muted-foreground">
                      {selectedFaculty.primaryAffiliation}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {step === "confirm" && showCrossProgramWarning && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                <p className="font-medium">Cross-Program Assignment</p>
                <p className="mt-1">
                  {selectedFaculty?.firstName} {selectedFaculty?.lastName} is not affiliated with{" "}
                  {selectedProgram?.name}. Are you sure you want to proceed?
                </p>
              </AlertDescription>
            </Alert>

            <div className="rounded-xl border bg-muted/40 p-4 space-y-2">
              <p className="text-sm font-medium">Assignment Summary</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex gap-2">
                  <span className="w-16 shrink-0 text-muted-foreground">Course</span>
                  <span className="font-medium">{selectedCourse?.code} — {selectedCourse?.title}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16 shrink-0 text-muted-foreground">Program</span>
                  <span>{selectedProgram?.code}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16 shrink-0 text-muted-foreground">Year</span>
                  <span>{getYearLevelDisplay(yearLevel)}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16 shrink-0 text-muted-foreground">Section</span>
                  <span>
                    {STUDENT_SECTION_OPTIONS.find((o) => o.value === section)?.label ?? section}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16 shrink-0 text-muted-foreground">Faculty</span>
                  <span>{selectedFaculty?.firstName} {selectedFaculty?.lastName}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {step !== "term" && step !== "confirm" && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            {step === "confirm" && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step === "confirm" ? (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Confirm Assignment"}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
