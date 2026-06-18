import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramForm } from "@/features/academic-structure/components/program-form";
import { createProgramAction } from "@/lib/actions/admin-program-actions";

export default function CreateProgramPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/secretary/programs"
        className="text-primary inline-flex items-center gap-2 text-sm font-medium hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      {/* Breadcrumb */}
      <nav className="text-text-muted text-xs">Programs &gt; Create New Program</nav>

      <Card>
        <CardHeader>
          <CardTitle>Create New Program</CardTitle>
          <CardDescription>
            Add a new academic program to the college. You can add majors after creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgramForm action={createProgramAction} submitLabel="Create Program" />
        </CardContent>
      </Card>
    </div>
  );
}
