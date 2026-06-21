"use client";

import { useState, useEffect, useRef } from "react";
import { YearLevel, StudentSection } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/components/ui/toast";
import { TermInstancePicker } from "@/features/academic-calendar/components/term-instance-picker";
import { ClassIdentityFields } from "../shared/class-identity-fields";
import { FacultySearchPopover } from "../shared/faculty-search-popover";
import { bulkCreateCourseAssignmentsAction } from "@/lib/actions/course-assignment-actions";
import type { FacultySearchResult } from "@/features/course-assignments/types";
import type { TermInstanceItem } from "@/features/academic-calendar/types";

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

interface AddMergedClassesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableCourses: Course[];
  availablePrograms: Program[];
  termInstances: TermInstanceItem[];
  defaultTermInstanceId?: string | null;
  phProgramScope?: string[]; // Filter programs for Program Head
  onSuccess?: () => void;
}

export function AddMergedClassesDialog({
  open,
  onOpenChange,
  availableCourses,
  availablePrograms,
  termInstances,
  defaultTermInstanceId,
  phProgramScope,
  onSuccess,
}: AddMergedClassesDialogProps) {
  const [step, setStep] = useState<"term" | "course" | "class" | "faculty" | "programs">("term");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [termInstanceId, setTermInstanceId] = useState<string | null>(defaultTermInstanceId ?? null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [yearLevel, setYearLevel] = useState<YearLevel>(YearLevel.FIRST_YEAR);
  const [hasTouchedYearLevel, setHasTouchedYearLevel] = useState(false);
  const [section, setSection] = useState<StudentSection>(StudentSection.MORNING);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultySearchResult | null>(null);
  const previousCourseId = useRef<string | null>(null);
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set());
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

  // Filter programs based on PH scope
  const filteredPrograms = phProgramScope
    ? availablePrograms.filter((p) => phProgramScope.includes(p.id))
    : availablePrograms;

  const selectedCourse = availableCourses.find((c) => c.id === courseId);

  // Pre-fill year level from course default (only if user hasn't touched it and course actually changed)
  useEffect(() => {
    if (courseId && courseId !== previousCourseId.current && !hasTouchedYearLevel) {
      const course = availableCourses.find((c) => c.id === courseId);
      if (course?.default_year_level) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- controlled prefill of default year level when course changes and user has not manually edited it
        setYearLevel(course.default_year_level);
      }
    }
    previousCourseId.current = courseId;
  }, [courseId, hasTouchedYearLevel, availableCourses]);

  const handleYearLevelChange = (value: YearLevel) => {
    setHasTouchedYearLevel(true);
    setYearLevel(value);
  };

  const handleToggleProgram = (programId: string) => {
    const newSelected = new Set(selectedPrograms);
    if (newSelected.has(programId)) {
      newSelected.delete(programId);
    } else {
      newSelected.add(programId);
    }
    setSelectedPrograms(newSelected);
  };

  const handleSelectAllPrograms = () => {
    if (selectedPrograms.size === filteredPrograms.length) {
      setSelectedPrograms(new Set());
    } else {
      setSelectedPrograms(new Set(filteredPrograms.map((p) => p.id)));
    }
  };

  const handleSubmit = async () => {
    if (!termInstanceId || !courseId || !selectedFaculty || selectedPrograms.size === 0) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setIsSubmitting(true);
    setItemErrors({});

    // Build N assignments (one per program) with same course/faculty/term/year/section
    const selectedProgramIds = Array.from(selectedPrograms);
    const assignments = selectedProgramIds.map((programId) => ({
      termInstanceId,
      facultyId: selectedFaculty.id,
      courseId,
      programId,
      yearLevel,
      section,
    }));

    const result = await bulkCreateCourseAssignmentsAction({ assignments });

    setIsSubmitting(false);

    const errorMap: Record<string, string> = {};
    result.errors.forEach(({ index, error }) => {
      const programId = selectedProgramIds[index];
      if (programId) {
        errorMap[programId] = error;
      }
    });
    setItemErrors(errorMap);

    if (result.success && result.errors.length === 0) {
      showToast(`Created ${result.created} merged class assignments successfully.`, "success");
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } else if (result.success) {
      showToast(`Created ${result.created} merged class assignments successfully.`, "success");
      showToast(
        `${result.errors.length} assignment(s) failed to create. Review the errors below.`,
        "warning"
      );
    } else {
      showToast(result.errors[0]?.error || "Failed to create merged classes.", "error");
    }
  };

  const resetForm = () => {
    setStep(defaultTermInstanceId ? "course" : "term");
    setTermInstanceId(defaultTermInstanceId ?? null);
    setCourseId(null);
    previousCourseId.current = null;
    setYearLevel(YearLevel.FIRST_YEAR);
    setHasTouchedYearLevel(false);
    setSection(StudentSection.MORNING);
    setSelectedFaculty(null);
    setSelectedPrograms(new Set());
    setItemErrors({});
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
        return !!section;
      case "faculty":
        return !!selectedFaculty;
      case "programs":
        return selectedPrograms.size > 0;
    }
  };

  const STEPS = [
    { key: "term" as const, label: "Term" },
    { key: "course" as const, label: "Course" },
    { key: "class" as const, label: "Class" },
    { key: "faculty" as const, label: "Faculty" },
    { key: "programs" as const, label: "Programs" },
  ];

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Create Merged Class Assignment</DialogTitle>
          <DialogDescription>
            Create course assignments for multiple programs taught together as one merged class. 
            Only General Education courses can be assigned as merged classes.
          </DialogDescription>
        </DialogHeader>

        {/* Step progress bar */}
        <div className="flex items-center gap-0 flex-wrap">
          {STEPS.map((s, i) => {
            const isCompleted = i < currentStepIndex;
            const isActive = i === currentStepIndex;
            return (
              <div key={s.key} className="flex items-center">
                <div className="flex flex-col items-center gap-1 px-1">
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
                    {isCompleted ? (
                      <span className="text-xs">✓</span>
                    ) : (
                      <span>{i + 1}</span>
                    )}
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
              <Label>General Education Course</Label>
              <Select value={courseId ?? ""} onValueChange={(value) => setCourseId(value || null)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a GE course..." />
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
            {selectedCourse && selectedCourse.default_year_level && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Default year level: {getYearLevelLabel(selectedCourse.default_year_level)}
                </span>
                <Badge variant="secondary">Will pre-fill</Badge>
              </div>
            )}
          </div>
        )}

        {step === "class" && (
          <div className="space-y-4">
            <ClassIdentityFields
              programId={filteredPrograms[0]?.id ?? ""}
              yearLevel={yearLevel}
              section={section}
              availablePrograms={filteredPrograms}
              onProgramChange={() => {}} // No-op: program selected in final step
              onYearLevelChange={handleYearLevelChange}
              onSectionChange={(value) => value && setSection(value)}
              disabled={true} // Program selection happens in programs step
            />
            <p className="text-sm text-muted-foreground">
              Programs will be selected in the next step. All selected programs will share the same 
              course, faculty, year level, and section.
            </p>
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
                targetProgramId={undefined} // Can be any faculty
                targetProgramName={undefined}
                onSelect={setSelectedFaculty}
              />
            </div>

            {selectedFaculty && (
              <div className="rounded-xl border bg-muted/40 p-4 space-y-2">
                <p className="text-sm font-medium">
                  {selectedFaculty.firstName} {selectedFaculty.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{selectedFaculty.email}</p>
                {selectedFaculty.primaryAffiliation && (
                  <p className="text-xs text-muted-foreground">
                    {selectedFaculty.primaryAffiliation}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {step === "programs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Select Programs</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAllPrograms}
                className="text-xs h-8"
              >
                {selectedPrograms.size === filteredPrograms.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="max-h-[300px] overflow-y-auto rounded-lg border">
              <div className="divide-y">
                {filteredPrograms.map((program) => (
                  <div key={program.id} className="flex flex-col gap-1 p-3 hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={program.id}
                        checked={selectedPrograms.has(program.id)}
                        onCheckedChange={() => handleToggleProgram(program.id)}
                      />
                      <Label htmlFor={program.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{program.code}</span>
                          <span className="text-sm text-muted-foreground">{program.name}</span>
                        </div>
                      </Label>
                    </div>
                    {itemErrors[program.id] && (
                      <p className="text-sm text-destructive pl-8" role="alert">
                        {itemErrors[program.id]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm">
                <span className="font-medium">{selectedPrograms.size}</span> program(s) selected. 
                This will create {selectedPrograms.size} assignment(s) - one per program.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {step !== "term" && (
              <Button variant="outline" onClick={() => {
                if (step === "course") setStep("term");
                else if (step === "class") setStep("course");
                else if (step === "faculty") setStep("class");
                else if (step === "programs") setStep("faculty");
              }}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            {step === "programs" ? (
              <Button onClick={handleSubmit} disabled={isSubmitting || !canProceed()}>
                {isSubmitting ? "Creating..." : `Create ${selectedPrograms.size} Assignment(s)`}
              </Button>
            ) : (
              <Button onClick={() => {
                if (step === "term") setStep("course");
                else if (step === "course") setStep("class");
                else if (step === "class") setStep("faculty");
                else if (step === "faculty") setStep("programs");
              }} disabled={!canProceed()}>
                Next
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getYearLevelLabel(yearLevel: YearLevel): string {
  const labels: Record<YearLevel, string> = {
    [YearLevel.FIRST_YEAR]: "1st Year",
    [YearLevel.SECOND_YEAR]: "2nd Year",
    [YearLevel.THIRD_YEAR]: "3rd Year",
    [YearLevel.FOURTH_YEAR]: "4th Year",
  };
  return labels[yearLevel];
}
