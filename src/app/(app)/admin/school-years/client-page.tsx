"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SchoolYearList } from "@/features/academic-calendar/components/school-year-list";
import { SchoolYearForm } from "@/features/academic-calendar/components/school-year-form";
import type { SchoolYearWithTerms } from "@/features/academic-calendar/types";

interface SchoolYearsClientPageProps {
  initialData: SchoolYearWithTerms[];
}

export function SchoolYearsClientPage({ initialData }: SchoolYearsClientPageProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">School Years</h1>
          <p className="text-muted-foreground mt-1">
            Manage academic years and their term instances
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create School Year
        </Button>
      </div>

      <SchoolYearForm
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => setOpen(false)}
      />

      <SchoolYearList
        schoolYears={initialData}
        onRefresh={() => {
          // Server actions handle revalidation
        }}
      />
    </div>
  );
}
