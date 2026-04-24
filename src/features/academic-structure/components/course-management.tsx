"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CourseScope } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createCourseAction,
  deleteCourseAction,
  toggleCourseActiveAction,
  updateCourseAction,
} from "@/lib/actions/admin-foundation-actions";
import { CourseForm } from "./course-form";

type ProgramOption = {
  id: string;
  code: string;
  name: string;
  majors: Array<{
    id: string;
    name: string;
  }>;
};

type CourseItem = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  course_scope: CourseScope;
  is_active: boolean;
  program_id: string | null;
  major_id: string | null;
  program: { id: string; code: string; name: string } | null;
  major: { id: string; name: string } | null;
  _count: {
    cilos: number;
    evaluations: number;
  };
};

type CourseManagementProps = {
  courses: CourseItem[];
  programs: ProgramOption[];
};

export function CourseManagement({ courses, programs }: CourseManagementProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const majorOptions = programs.flatMap((program) =>
    program.majors.map((major) => ({
      id: major.id,
      name: major.name,
      program_id: program.id,
      program_code: program.code,
    })),
  );

  function handleToggleCourse(id: string, nextActive: boolean) {
    startTransition(async () => {
      const result = await toggleCourseActiveAction(id, nextActive);

      if (!result.success) {
        alert(result.error);
        return;
      }

      router.refresh();
    });
  }

  function handleDeleteCourse(id: string, label: string) {
    if (!confirm(`Delete ${label}? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteCourseAction(id);

      if (!result.success) {
        alert(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Course</CardTitle>
          <CardDescription>
            Register general education, program-wide, or major-specific courses for downstream
            publishing flows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourseForm
            action={createCourseAction}
            programs={programs}
            majors={majorOptions}
            submitLabel="Create Course"
            onSuccess={() => router.refresh()}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {courses.map((course) => (
          <Card key={course.id} className={!course.is_active ? "opacity-75" : ""}>
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>
                    {course.code} - {course.title}
                  </CardTitle>
                  <CardDescription>
                    {course.course_scope === CourseScope.GENERAL_EDUCATION
                      ? "General Education"
                      : course.major
                        ? `${course.program?.code ?? "Program"} - ${course.major.name}`
                        : `${course.program?.code ?? "Program"} - Shared Program Course`}
                  </CardDescription>
                </div>
                <Badge variant={course.is_active ? "default" : "secondary"}>
                  {course.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
                <span>{course._count.cilos} CILOs</span>
                <span>&bull;</span>
                <span>{course._count.evaluations} evaluations</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CourseForm
                action={updateCourseAction}
                programs={programs}
                majors={majorOptions}
                defaultValues={course}
                submitLabel="Update Course"
                onSuccess={() => router.refresh()}
              />

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleToggleCourse(course.id, !course.is_active)}
                >
                  {course.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDeleteCourse(course.id, `${course.code} - ${course.title}`)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
