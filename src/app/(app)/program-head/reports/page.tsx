import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProgramHeadReportsPage() {
  const reports = [
    "Course-bound CILO summary",
    "Stakeholder deployment completion",
    "Program outcome attainment digest",
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Program Reports</h1>
        <p className="text-sm text-text-secondary">
          Export buttons are intentionally stubbed while the reporting surface is being scaffolded.
        </p>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report}>
            <CardHeader>
              <CardTitle>{report}</CardTitle>
              <CardDescription>Prepared for later PDF and spreadsheet export integration.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button variant="outline">Export PDF Stub</Button>
                <Button variant="outline">Export Sheet Stub</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
