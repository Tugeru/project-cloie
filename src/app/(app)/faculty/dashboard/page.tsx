import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FacultyDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
        <p>Faculty course and deployment tools will live here.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/faculty/cilo-evaluations">Go to CILO Evaluations</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/faculty/cilo-evaluations/new">Publish New Evaluation</Link>
        </Button>
      </div>
    </div>
  );
}
