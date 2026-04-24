"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createYearLevelAction,
  deleteYearLevelAction,
  updateYearLevelAction,
} from "@/lib/actions/admin-foundation-actions";
import { YearLevelForm } from "./year-level-form";

type YearLevelItem = {
  id: string;
  name: string;
  order: number;
  _count: {
    student_profiles: number;
    course_bound_targets: number;
    central_deployments: number;
  };
};

type YearLevelManagementProps = {
  yearLevels: YearLevelItem[];
};

export function YearLevelManagement({ yearLevels }: YearLevelManagementProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDeleteYearLevel(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteYearLevelAction(id);

      if (!result.success) {
        alert(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Year Level</CardTitle>
          <CardDescription>
            Manage the year-level groups used by student context and deployment targeting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <YearLevelForm
            action={createYearLevelAction}
            submitLabel="Create Year Level"
            onSuccess={() => router.refresh()}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {yearLevels.map((yearLevel) => (
          <Card key={yearLevel.id}>
            <CardHeader>
              <CardTitle>
                {yearLevel.name}{" "}
                <span className="text-sm font-normal text-text-muted">Order {yearLevel.order}</span>
              </CardTitle>
              <CardDescription>
                {yearLevel._count.student_profiles} students &bull;{" "}
                {yearLevel._count.course_bound_targets} course targets &bull;{" "}
                {yearLevel._count.central_deployments} central deployments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <YearLevelForm
                action={updateYearLevelAction}
                defaultValues={yearLevel}
                submitLabel="Update Year Level"
                onSuccess={() => router.refresh()}
              />

              <div className="border-t border-border pt-4">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDeleteYearLevel(yearLevel.id, yearLevel.name)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
