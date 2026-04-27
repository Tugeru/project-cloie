"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createMajorAction,
  deleteMajorAction,
  toggleMajorActiveAction,
  toggleProgramActiveAction,
} from "@/lib/actions/admin-program-actions";
import { MajorForm } from "./major-form";

type Major = {
  id: string;
  name: string;
  is_active: boolean;
};

type ProgramItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  majors: Major[];
  _count: {
    courses: number;
    gos: number;
    student_profiles: number;
    faculty_program_affiliations: number;
  };
};

type ProgramListProps = {
  programs: ProgramItem[];
};

export function ProgramList({ programs }: ProgramListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggleProgram(id: string, active: boolean) {
    startTransition(async () => {
      await toggleProgramActiveAction(id, active);
      router.refresh();
    });
  }

  function handleToggleMajor(id: string, active: boolean) {
    startTransition(async () => {
      await toggleMajorActiveAction(id, active);
      router.refresh();
    });
  }

  function handleDeleteMajor(id: string, name: string) {
    if (!confirm(`Delete major "${name}"? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteMajorAction(id);

      if (!result.success) {
        alert(result.error);
      }

      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {programs.map((program) => (
        <Card key={program.id} className={!program.is_active ? "opacity-60" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">
                  {program.code} - {program.name}
                </CardTitle>
                {program.description && (
                  <p className="text-text-muted mt-1 text-sm">{program.description}</p>
                )}
              </div>
              <Badge variant={program.is_active ? "default" : "secondary"}>
                {program.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="text-text-secondary mt-2 flex flex-wrap gap-2 text-xs">
              <span>{program._count.courses} courses</span>
              <span>&bull;</span>
              <span>{program._count.gos} GOs</span>
              <span>&bull;</span>
              <span>{program._count.student_profiles} students</span>
              <span>&bull;</span>
              <span>{program._count.faculty_program_affiliations} faculty</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {program.majors.length > 0 && (
              <div className="space-y-1">
                <p className="text-text-secondary text-xs font-semibold tracking-wide uppercase">
                  Majors
                </p>
                {program.majors.map((major) => (
                  <div
                    key={major.id}
                    className="border-border flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm"
                  >
                    <span className={!major.is_active ? "text-text-muted line-through" : ""}>
                      {major.name}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        disabled={isPending}
                        onClick={() => handleToggleMajor(major.id, !major.is_active)}
                      >
                        {major.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger h-6 px-2 text-xs"
                        disabled={isPending}
                        onClick={() => handleDeleteMajor(major.id, major.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <MajorForm
              action={createMajorAction}
              programId={program.id}
              onSuccess={() => router.refresh()}
            />

            <div className="border-border flex gap-2 border-t pt-2">
              <Link
                href={`/admin/programs/${program.id}/edit`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Edit Program
              </Link>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => handleToggleProgram(program.id, !program.is_active)}
              >
                {program.is_active ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
