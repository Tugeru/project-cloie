import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DeanReportsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Dean Reports</h1>
        <p className="text-text-secondary text-sm">
          Report cards are wired for college-wide visibility; export implementations remain stubbed
          for now.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Report Stubs</CardTitle>
          <CardDescription>
            Prototype-only controls for the outline-defense MVP surface.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {["College summary", "Program comparison matrix", "Stakeholder completion report"].map(
            (report) => (
              <div key={report} className="border-border rounded-xl border px-4 py-3">
                <p className="font-medium">{report}</p>
                <div className="mt-3 flex gap-3">
                  <Button variant="outline">PDF Stub</Button>
                  <Button variant="outline">Sheet Stub</Button>
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
