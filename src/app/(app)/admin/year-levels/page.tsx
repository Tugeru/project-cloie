import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractivePlaceholderForm } from "@/components/ui/interactive-placeholder-form";
import { SEMESTER_OPTIONS } from "@/lib/constants/academic";

export default async function AdminYearLevelsPage() {
  const yearLevels = await prisma.yearLevel.findMany({
    include: {
      sections: true,
    },
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Year Levels and Sections</h1>
        <p className="text-sm text-text-secondary">
          Configure cohort structure without hardcoding any academic grouping into the app.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Levels</CardTitle>
          <CardDescription>Sections remain tied to academic year and semester context.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {yearLevels.map((yearLevel) => (
            <div key={yearLevel.id} className="rounded-xl border border-border px-4 py-3">
              <p className="font-medium">{yearLevel.name}</p>
              <p className="text-sm text-text-muted">
                {yearLevel.sections.length > 0
                  ? `${yearLevel.sections.length} configured section(s)`
                  : "No sections configured yet"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <InteractivePlaceholderForm
        title="Section Builder Stub"
        description="Capture the year-level and section metadata needed for future CRUD."
        submitLabel="Save Section Draft"
        fields={[
          { id: "year_level", kind: "input", label: "Year Level", placeholder: "1st Year" },
          { id: "section", kind: "input", label: "Section Name", placeholder: "Section A" },
          { id: "academic_year", kind: "input", label: "Academic Year", placeholder: "2026-2027" },
          {
            id: "semester",
            kind: "select",
            label: "Semester",
            options: SEMESTER_OPTIONS.map((option) => ({ label: option.label, value: option.value })),
          },
        ]}
      />
    </div>
  );
}
