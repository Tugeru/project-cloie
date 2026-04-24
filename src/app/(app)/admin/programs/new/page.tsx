import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProgramForm } from "@/features/academic-structure/components/program-form";
import { createProgramAction } from "@/lib/actions/admin-program-actions";

export default function CreateProgramPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/admin/programs"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      {/* Breadcrumb */}
      <nav className="text-xs text-text-muted">
        Programs &gt; Create New Program
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>Create New Program</CardTitle>
          <CardDescription>
            Add a new academic program to the college. You can add majors after
            creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgramForm
            action={createProgramAction}
            submitLabel="Create Program"
          />
        </CardContent>
      </Card>
    </div>
  );
}
