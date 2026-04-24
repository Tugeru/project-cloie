import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractivePlaceholderForm } from "@/components/ui/interactive-placeholder-form";

export default async function AdminYearLevelsPage() {
  const yearLevels = await prisma.yearLevel.findMany({
    include: {
      _count: {
        select: {
          student_profiles: true,
          course_bound_targets: true,
          central_deployments: true,
        },
      },
    },
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Year Levels</h1>
        <p className="text-sm text-text-secondary">
          Student context and targeting now rely on program, optional major, and year
          level only.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Year Levels</CardTitle>
          <CardDescription>
            Use these levels for student academic profiles and deployment targeting.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {yearLevels.map((yearLevel) => (
            <div key={yearLevel.id} className="rounded-xl border border-border px-4 py-3">
              <p className="font-medium">
                {yearLevel.order}. {yearLevel.name}
              </p>
              <p className="text-sm text-text-muted">
                {yearLevel._count.student_profiles} students •{" "}
                {yearLevel._count.course_bound_targets} course-bound targets •{" "}
                {yearLevel._count.central_deployments} central deployments
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <InteractivePlaceholderForm
        title="Year Level Editor Stub"
        description="This placeholder is aligned to the sectionless MVP model."
        submitLabel="Save Year Level Draft"
        fields={[
          { id: "year_level", kind: "input", label: "Year Level", placeholder: "4th Year" },
          { id: "order", kind: "input", label: "Display Order", placeholder: "4" },
        ]}
      />
    </div>
  );
}
