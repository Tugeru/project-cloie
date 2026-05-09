"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { showToast } from "@/components/ui/toast";
import { TermInstancePicker } from "@/features/academic-calendar/components/term-instance-picker";
import { ClassIdentityFields } from "./shared/class-identity-fields";
import { FacultySearchPopover } from "./shared/faculty-search-popover";
import { createCourseAssignmentAction } from "@/lib/actions/course-assignment-actions";
import { searchFacultyPoolAction } from "@/lib/actions/course-assignment-actions";
import type { FacultySearchResult } from "@/features/course-assignments/types";

interface Course {
  id: string;
  code: string;
  title: string;
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
  const [section, setSection] = useState<StudentSection | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultySearchResult | null>(null);
  const [showCrossProgramWarning, setShowCrossProgramWarning] = useState(false);

  const selectedCourse = availableCourses.find((c) => c.id === courseId);
  const selectedProgram = availablePrograms.find((p) => p.id === programId);

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
      showToast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "error",
      });
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
      showToast({
        title: "Success",
        description: "Course assignment created successfully.",
        variant: "success",
      });
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } else {
      showToast({
        title: "Error",
        description: result.error || "Failed to create assignment.",
        variant: "error",
      });
    }
  };

  const resetForm = () => {
    setStep(defaultTermInstanceId ? "course" : "term");
    setTermInstanceId(defaultTermInstanceId ?? null);
    setCourseId(defaultCourseId ?? null);
    setProgramId(availablePrograms[0]?.id ?? "");
    setYearLevel(YearLevel.FIRST_YEAR);
    setSection(null);
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
        return !!programId;
      case "faculty":
        return !!selectedFaculty;
      case "confirm":
        return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign Faculty to Course</DialogTitle>
          <DialogDescription>
            Step {step === "term" ? 1 : step === "course" ? 2 : step === "class" ? 3 : step === "faculty" ? 4 : 5} of 5
          </DialogDescription>
        </DialogHeader>

        {step === "term" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Academic Term</Label>
              <TermInstancePicker
                value={termInstanceId ?? undefined}
                onChange={setTermInstanceId}
              />
            </div>
          </div>
        )}

        {step === "course" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <select
                value={courseId ?? ""}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">Select a course...</option>
                {availableCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} — {course.title}
                  </option>
                ))}
              </select>
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
              onYearLevelChange={setYearLevel}
              onSectionChange={setSection}
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

            {selectedFaculty && selectedProgram && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm font-medium">Selected Faculty</p>
                <p className="text-sm">
                  {selectedFaculty.firstName} {selectedFaculty.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{selectedFaculty.email}</p>
                {selectedFaculty.primaryAffiliation && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Primary: {selectedFaculty.primaryAffiliation}
                  </p>
                )}
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

            <div className="rounded-md bg-muted p-3 space-y-2">
              <p className="text-sm font-medium">Assignment Summary</p>
              <p className="text-sm">
                <span className="text-muted-foreground">Course:</span>{" "}
                {selectedCourse?.code} — {selectedCourse?.title}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Class:</span>{" "}
                {selectedProgram?.code} — {yearLevel}
                {section ? ` (${section})` : ""}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Faculty:</span>{" "}
                {selectedFaculty?.firstName} {selectedFaculty?.lastName}
              </p>
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
