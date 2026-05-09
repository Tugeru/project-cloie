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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
}

interface Program {
  id: string;
  code: string;
  name: string;
}

interface AddCoursesForClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableCourses: Course[];
  availablePrograms: Program[];
  termInstances: TermInstanceItem[];
  onSuccess?: () => void;
}

export function AddCoursesForClassDialog({
  open,
  onOpenChange,
  availableCourses,
  availablePrograms,
  termInstances,
  onSuccess,
}: AddCoursesForClassDialogProps) {
  const [step, setStep] = useState<"term" | "class" | "faculty" | "courses">("term");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [termInstanceId, setTermInstanceId] = useState<string | null>(null);
  const [programId, setProgramId] = useState<string>(availablePrograms[0]?.id ?? "");
  const [yearLevel, setYearLevel] = useState<YearLevel>(YearLevel.FIRST_YEAR);
  const [section, setSection] = useState<StudentSection | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultySearchResult | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());

  const handleToggleCourse = (courseId: string) => {
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId);
    } else {
      newSelected.add(courseId);
    }
    setSelectedCourses(newSelected);
  };

  const handleSubmit = async () => {
    if (!termInstanceId || !selectedFaculty || selectedCourses.size === 0) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setIsSubmitting(true);

    const assignments = Array.from(selectedCourses).map((courseId) => ({
      termInstanceId,
      facultyId: selectedFaculty.id,
      courseId,
      programId,
      yearLevel,
      section,
    }));

    const result = await bulkCreateCourseAssignmentsAction({ assignments });

    setIsSubmitting(false);

    if (result.success) {
      showToast(`Created ${result.created} course assignments successfully.`, "success");
      if (result.errors.length > 0) {
        showToast(`${result.errors.length} assignments failed to create.`, "error");
      }
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } else {
      showToast("Failed to create course assignments.", "error");
    }
  };

  const resetForm = () => {
    setStep("term");
    setTermInstanceId(null);
    setProgramId(availablePrograms[0]?.id ?? "");
    setYearLevel(YearLevel.FIRST_YEAR);
    setSection(null);
    setSelectedFaculty(null);
    setSelectedCourses(new Set());
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Add: Courses for a Class</DialogTitle>
          <DialogDescription>
            Assign multiple courses to the same class and faculty.
          </DialogDescription>
        </DialogHeader>

        {step === "term" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Academic Term</Label>
              <TermInstancePicker
                termInstances={termInstances}
                value={termInstanceId ?? undefined}
                onChange={setTermInstanceId}
              />
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
                onSelect={setSelectedFaculty}
              />
            </div>
          </div>
        )}

        {step === "courses" && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Select courses to assign to {selectedFaculty?.firstName} {selectedFaculty?.lastName} for{" "}
              {availablePrograms.find((p) => p.id === programId)?.code} {yearLevel}
              {section ? ` (${section})` : ""}
            </div>
            <div className="max-h-[300px] overflow-auto space-y-2 border rounded-md p-2">
              {availableCourses.map((course) => (
                <div key={course.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`course-${course.id}`}
                    checked={selectedCourses.has(course.id)}
                    onCheckedChange={() => handleToggleCourse(course.id)}
                  />
                  <Label htmlFor={`course-${course.id}`} className="flex-1 cursor-pointer">
                    <span className="font-medium">{course.code}</span> — {course.title}
                  </Label>
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedCourses.size} course(s) selected
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {step !== "term" && (
              <Button variant="outline" onClick={() => {
                if (step === "class") setStep("term");
                else if (step === "faculty") setStep("class");
                else if (step === "courses") setStep("faculty");
              }}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step === "courses" ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedCourses.size === 0}
              >
                {isSubmitting ? "Creating..." : `Create ${selectedCourses.size} Assignments`}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (step === "term") setStep("class");
                  else if (step === "class") setStep("faculty");
                  else if (step === "faculty") setStep("courses");
                }}
                disabled={
                  (step === "term" && !termInstanceId) ||
                  (step === "faculty" && !selectedFaculty)
                }
              >
                Next
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
