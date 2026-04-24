"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { customZodResolver } from "@/lib/forms/zod-resolver";
import {
  studentProfileSchema,
  type StudentProfileInput,
} from "@/lib/schemas/student-profile";
import { registerStudentProfile } from "@/lib/actions/onboarding-actions";
import { createClient } from "@/lib/supabase/client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Mail,
  UserCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Program = {
  id: string;
  name: string;
  code: string;
  majors: { id: string; name: string }[];
};

type YearLevel = {
  id: string;
  name: string;
  order: number;
};

type StudentProfileFormProps = {
  email: string;
  initialFirstName: string;
  initialLastName: string;
  programs: Program[];
  yearLevels: YearLevel[];
};

export function StudentProfileForm({
  email,
  initialFirstName,
  initialLastName,
  programs,
  yearLevels,
}: StudentProfileFormProps) {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudentProfileInput>({
    resolver: customZodResolver(studentProfileSchema),
    defaultValues: {
      first_name: initialFirstName,
      last_name: initialLastName,
      program_id: "",
      major_id: "",
      year_level_id: "",
      student_id_number: "",
    },
  });

  const selectedProgramId = watch("program_id");
  const selectedProgramObj = programs.find((p) => p.id === selectedProgramId);
  const requiresMajor =
    selectedProgramObj?.majors && selectedProgramObj.majors.length > 0;

  // Lookup helpers to display labels instead of UUIDs
  const getProgramLabel = (id: string) => {
    const p = programs.find((prog) => prog.id === id);
    return p ? `${p.code} — ${p.name}` : "";
  };

  const getMajorLabel = (id: string) => {
    const m = selectedProgramObj?.majors.find((major) => major.id === id);
    return m ? m.name : "";
  };

  const getYearLevelLabel = (id: string) => {
    const yl = yearLevels.find((y) => y.id === id);
    return yl ? yl.name : "";
  };

  const onSubmit = async (data: StudentProfileInput) => {
    setGlobalError(null);
    const result = await registerStudentProfile(data);

    if (result.error) {
      setGlobalError(result.error);
      return;
    }

    if (result.success === true) {
      // Full-page navigation instead of client-side router.push to ensure
      // the (app) layout loads fresh with the newly-created student profile.
      // Client-side push + refresh causes a race between the new route and
      // the stale React cache() session in the current (public) layout.
      window.location.href = "/dashboard";
    }
  };

  return (
    <Card className="overflow-hidden border-border shadow-lg">
      {/* Step indicator header */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <span className="text-label-md font-bold uppercase tracking-wider text-primary">
          Onboarding
        </span>
        <span className="text-caption text-text-muted">Step 1 of 1</span>
      </div>
      <div className="h-1 w-full bg-primary" />

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-8 px-6 py-8 sm:px-8">
          {/* Page heading */}
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-bold text-text-primary">
              Student Profile Setup
            </h1>
            <p className="text-body-sm text-text-secondary">
              Please provide your academic details to continue with your
              registration.
            </p>
          </div>

          {globalError && (
            <Alert
              variant="destructive"
              className="border-danger/50 bg-danger-soft text-danger"
            >
              <AlertCircle className="size-4" />
              <AlertDescription>{globalError}</AlertDescription>
            </Alert>
          )}

          {/* Section: Identity Information */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <UserCircle className="size-5 text-primary" />
              <h2 className="text-label-lg font-bold uppercase tracking-wider text-primary">
                Identity Information
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="first_name"
                  className="text-label-sm font-semibold uppercase tracking-wider text-text-secondary"
                >
                  First Name
                </Label>
                <Input
                  id="first_name"
                  {...register("first_name")}
                  className={
                    errors.first_name
                      ? "border-danger focus-visible:ring-danger"
                      : ""
                  }
                />
                {errors.first_name && (
                  <p className="text-xs text-danger">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="last_name"
                  className="text-label-sm font-semibold uppercase tracking-wider text-text-secondary"
                >
                  Last Name
                </Label>
                <Input
                  id="last_name"
                  {...register("last_name")}
                  className={
                    errors.last_name
                      ? "border-danger focus-visible:ring-danger"
                      : ""
                  }
                />
                {errors.last_name && (
                  <p className="text-xs text-danger">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            {initialFirstName && (
              <p className="text-caption text-text-muted">
                Retrieved from your Google account
              </p>
            )}

            {/* Institutional Email */}
            <div className="space-y-2">
              <Label className="text-label-sm font-semibold uppercase tracking-wider text-text-secondary">
                Institutional Email
              </Label>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted px-4 py-2.5">
                <Mail className="size-4 shrink-0 text-text-muted" />
                <span className="text-body-md text-text-secondary">
                  {email}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Academic Records */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              <h2 className="text-label-lg font-bold uppercase tracking-wider text-primary">
                Academic Records
              </h2>
            </div>

            {/* Academic Program */}
            <div className="space-y-2">
              <Label className="text-label-sm font-semibold uppercase tracking-wider text-text-secondary">
                Academic Program
              </Label>
              <Controller
                name="program_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      className={`w-full ${errors.program_id ? "border-danger" : ""}`}
                    >
                      <SelectValue placeholder="Select your program">
                        {field.value ? getProgramLabel(field.value) : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.code} — {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.program_id && (
                <p className="flex items-center gap-1 text-xs text-danger">
                  <AlertCircle className="size-3" />
                  {errors.program_id.message}
                </p>
              )}
            </div>

            {/* Major — conditional */}
            <div className="space-y-2">
              <Label className="text-label-sm font-semibold uppercase tracking-wider text-text-secondary">
                Major (if applicable)
              </Label>
              {requiresMajor ? (
                <Controller
                  name="major_id"
                  control={control}
                  rules={{
                    required: requiresMajor
                      ? "A major is required for this program"
                      : false,
                  }}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <SelectTrigger
                        className={`w-full ${errors.major_id ? "border-danger" : ""}`}
                      >
                        <SelectValue placeholder="Select your major">
                          {field.value ? getMajorLabel(field.value) : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProgramObj!.majors.map((major) => (
                          <SelectItem key={major.id} value={major.id}>
                            {major.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : (
                <div className="flex items-center rounded-lg border border-border bg-surface-muted px-4 py-2.5">
                  <span className="text-body-md text-text-muted">
                    General / No Major
                  </span>
                </div>
              )}
              {errors.major_id && (
                <p className="flex items-center gap-1 text-xs text-danger">
                  <AlertCircle className="size-3" />
                  {errors.major_id.message}
                </p>
              )}
            </div>

            {/* Student ID + Year Level side by side */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="student_id_number"
                  className="text-label-sm font-semibold uppercase tracking-wider text-text-secondary"
                >
                  School ID Number
                </Label>
                <Input
                  id="student_id_number"
                  placeholder="e.g., 1000816695"
                  {...register("student_id_number")}
                  className={
                    errors.student_id_number
                      ? "border-danger focus-visible:ring-danger"
                      : ""
                  }
                />
                {errors.student_id_number && (
                  <p className="flex items-center gap-1 text-xs text-danger">
                    <AlertCircle className="size-3" />
                    Required field
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-label-sm font-semibold uppercase tracking-wider text-text-secondary">
                  Year Level
                </Label>
                <Controller
                  name="year_level_id"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger
                        className={`w-full ${errors.year_level_id ? "border-danger" : ""}`}
                      >
                        <SelectValue placeholder="Select year">
                          {field.value
                            ? getYearLevelLabel(field.value)
                            : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {yearLevels.map((yl) => (
                          <SelectItem key={yl.id} value={yl.id}>
                            {yl.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.year_level_id && (
                  <p className="flex items-center gap-1 text-xs text-danger">
                    <AlertCircle className="size-3" />
                    {errors.year_level_id.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 px-6 pb-8 pt-2 sm:px-8">
          <Button
            type="submit"
            className="w-full gap-2 py-6 text-base font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Finalizing..." : "Submit and Continue"}
            {!isSubmitting && <ArrowRight className="size-5" />}
          </Button>

          <button
            type="button"
            className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.push("/login");
            }}
          >
            <ArrowLeft className="size-4" />
            Cancel / Back to Login
          </button>
        </CardFooter>
      </form>
    </Card>
  );
}
