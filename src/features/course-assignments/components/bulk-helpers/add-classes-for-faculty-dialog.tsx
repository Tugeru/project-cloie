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

interface ClassConfig {
  id: string;
  programId: string;
  yearLevel: YearLevel;
  section: StudentSection | null;
}

interface AddClassesForFacultyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableCourses: Course[];
  availablePrograms: Program[];
  termInstances: TermInstanceItem[];
  defaultCourseId?: string;
  onSuccess?: () => void;
}

export function AddClassesForFacultyDialog({
  open,
  onOpenChange,
  availableCourses,
  availablePrograms,
  termInstances,
  defaultCourseId,
  onSuccess,
}: AddClassesForFacultyDialogProps) {
  const [step, setStep] = useState<"term" | "course" | "faculty" | "classes">("term");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [termInstanceId, setTermInstanceId] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string>(defaultCourseId ?? "");
  const [selectedFaculty, setSelectedFaculty] = useState<FacultySearchResult | null>(null);
  const [classConfigs, setClassConfigs] = useState<ClassConfig[]>([
    {
      id: "1",
      programId: availablePrograms[0]?.id ?? "",
      yearLevel: YearLevel.FIRST_YEAR,
      section: null,
    },
  ]);

  const addClassConfig = () => {
    setClassConfigs([
      ...classConfigs,
      {
        id: String(classConfigs.length + 1),
        programId: availablePrograms[0]?.id ?? "",
        yearLevel: YearLevel.FIRST_YEAR,
        section: null,
      },
    ]);
  };

  const removeClassConfig = (id: string) => {
    setClassConfigs(classConfigs.filter((c) => c.id !== id));
  };

  const updateClassConfig = (id: string, updates: Partial<ClassConfig>) => {
    setClassConfigs(
      classConfigs.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleSubmit = async () => {
    if (!termInstanceId || !courseId || !selectedFaculty || classConfigs.length === 0) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setIsSubmitting(true);

    const assignments = classConfigs.map((config) => ({
      termInstanceId,
      facultyId: selectedFaculty.id,
      courseId,
      programId: config.programId,
      yearLevel: config.yearLevel,
      section: config.section,
    }));

    const result = await bulkCreateCourseAssignmentsAction({ assignments });

    setIsSubmitting(false);

    if (result.success) {
      showToast(`Created ${result.created} class assignments successfully.`, "success");
      if (result.errors.length > 0) {
        showToast(`${result.errors.length} assignments failed to create.`, "error");
      }
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } else {
      showToast("Failed to create class assignments.", "error");
    }
  };

  const resetForm = () => {
    setStep("term");
    setTermInstanceId(null);
    setCourseId(defaultCourseId ?? "");
    setSelectedFaculty(null);
    setClassConfigs([
      {
        id: "1",
        programId: availablePrograms[0]?.id ?? "",
        yearLevel: YearLevel.FIRST_YEAR,
        section: null,
      },
    ]);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const selectedCourse = availableCourses.find((c) => c.id === courseId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Bulk Add: Classes for a Faculty</DialogTitle>
          <DialogDescription>
            Assign the same course to multiple classes for the same faculty.
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

        {step === "course" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <select
                value={courseId}
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

        {step === "classes" && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Configure classes for {selectedFaculty?.firstName} {selectedFaculty?.lastName} to teach{" "}
              {selectedCourse?.code} {selectedCourse?.title}
            </div>

            <div className="space-y-4 max-h-[400px] overflow-auto">
              {classConfigs.map((config, index) => (
                <div key={config.id} className="border rounded-md p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Class {index + 1}</h4>
                    {classConfigs.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeClassConfig(config.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <ClassIdentityFields
                    programId={config.programId}
                    yearLevel={config.yearLevel}
                    section={config.section}
                    availablePrograms={availablePrograms}
                    onProgramChange={(value) =>
                      updateClassConfig(config.id, { programId: value })
                    }
                    onYearLevelChange={(value) =>
                      updateClassConfig(config.id, { yearLevel: value })
                    }
                    onSectionChange={(value) =>
                      updateClassConfig(config.id, { section: value })
                    }
                  />
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={addClassConfig} className="w-full">
              + Add Another Class
            </Button>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {step !== "term" && (
              <Button variant="outline" onClick={() => {
                if (step === "course") setStep("term");
                else if (step === "faculty") setStep("course");
                else if (step === "classes") setStep("faculty");
              }}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step === "classes" ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || classConfigs.length === 0}
              >
                {isSubmitting ? "Creating..." : `Create ${classConfigs.length} Assignments`}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (step === "term") setStep("course");
                  else if (step === "course") setStep("faculty");
                  else if (step === "faculty") setStep("classes");
                }}
                disabled={
                  (step === "term" && !termInstanceId) ||
                  (step === "course" && !courseId) ||
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
