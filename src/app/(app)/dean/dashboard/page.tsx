import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DeanDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Dean Dashboard</h1>
        <p>Cross-program analytics and reports will live here.</p>
      </div>

      <Button asChild>
        <Link href="/dean/cilo-reviews">Go to College CILO Reviews</Link>
      </Button>
    </div>
  );
}
