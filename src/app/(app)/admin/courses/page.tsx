import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractivePlaceholderForm } from "@/components/ui/interactive-placeholder-form";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    include: {
      major: true,
      program: true,
    },
    orderBy: [{ course_scope: "asc" }, { code: "asc" }],
    take: 12,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Courses</h1>
        <p className="text-sm text-text-secondary">
          Manage the shared course catalog for general education, program-wide, and
          major-specific contexts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scope Preview</CardTitle>
          <CardDescription>
            General education courses stay college-wide. Program-specific courses can
            optionally narrow into a major.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="rounded-xl border border-border px-4 py-3">
              <p className="font-medium">
                {course.code} - {course.title}
              </p>
              <p className="text-sm text-text-muted">
                {course.course_scope === "GENERAL_EDUCATION"
                  ? "General Education"
                  : course.major?.name
                    ? `${course.program?.code ?? "Program"} • ${course.major.name}`
                    : `${course.program?.code ?? "Program"} • Shared Program Course`}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <InteractivePlaceholderForm
        title="Course Editor Stub"
        description="Prototype the admin course flow with explicit scope, program, and optional major."
        submitLabel="Save Course Draft"
        fields={[
          { id: "code", kind: "input", label: "Course Code", placeholder: "IT101" },
          { id: "title", kind: "input", label: "Course Title", placeholder: "Introduction to Computing" },
          {
            id: "scope",
            kind: "select",
            label: "Course Scope",
            options: [
              { label: "General Education", value: "GENERAL_EDUCATION" },
              { label: "Program-Specific", value: "PROGRAM_SPECIFIC" },
            ],
          },
          { id: "program", kind: "input", label: "Program Code", placeholder: "Required for program-specific courses" },
          { id: "major", kind: "input", label: "Major", placeholder: "Optional major context" },
        ]}
      />
    </div>
  );
}
