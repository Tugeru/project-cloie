"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { listCourseAssignmentsForProgramHeadAction } from "@/lib/actions/course-assignment-actions";
import { CourseAssignmentFormDialog } from "./course-assignment-form-dialog";
import type { CourseAssignmentItem } from "@/features/course-assignments/types";
import type { TermInstanceItem } from "@/features/academic-calendar/types";

interface CourseRowAssignmentsSheetProps {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  termInstanceId: string | null;
  termInstances: TermInstanceItem[];
  availablePrograms: Array<{ id: string; code: string; name: string }>;
  availableCourses: Array<{ id: string; code: string; title: string }>;
  children: React.ReactNode;
}

export function CourseRowAssignmentsSheet({
  courseId,
  courseCode,
  courseTitle,
  termInstanceId,
  termInstances,
  availablePrograms,
  availableCourses,
  children,
}: CourseRowAssignmentsSheetProps) {
  const [open, setOpen] = useState(false);
  const [assignments, setAssignments] = useState<CourseAssignmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (open && termInstanceId) {
      loadAssignments();
    }
  }, [open, termInstanceId]);

  const loadAssignments = async () => {
    if (!termInstanceId) return;
    
    setLoading(true);
    const result = await listCourseAssignmentsForProgramHeadAction({
      termInstanceId,
      courseId,
    });
    
    if (result.success) {
      setAssignments(result.data.items);
    }
    setLoading(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger>{children}</SheetTrigger>
        <SheetContent className="sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>
              {courseCode} — {courseTitle}
            </SheetTitle>
            <SheetDescription>
              Faculty assignments for this course in the selected term.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {!termInstanceId ? (
              <div className="text-center py-8 text-muted-foreground">
                Please select a term to view assignments.
              </div>
            ) : loading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No faculty assigned yet for this course in the selected term.
              </div>
            ) : (
              <div className="space-y-2">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 rounded-md border"
                  >
                    <div>
                      <p className="font-medium">{assignment.facultyName}</p>
                      <p className="text-sm text-muted-foreground">{assignment.facultyEmail}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {assignment.programCode}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {assignment.yearLevel}
                          {assignment.section ? ` • ${assignment.section}` : ""}
                        </span>
                      </div>
                    </div>
                    <Badge variant={assignment.isActive ? "default" : "secondary"}>
                      {assignment.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {termInstanceId && (
              <Button
                className="w-full"
                onClick={() => setDialogOpen(true)}
                disabled={!termInstanceId}
              >
                <Plus className="mr-2 h-4 w-4" />
                Assign Faculty
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CourseAssignmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        availableCourses={availableCourses}
        availablePrograms={availablePrograms}
        termInstances={termInstances}
        defaultTermInstanceId={termInstanceId}
        defaultCourseId={courseId}
        onSuccess={() => {
          loadAssignments();
        }}
      />
    </>
  );
}
