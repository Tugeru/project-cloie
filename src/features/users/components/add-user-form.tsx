"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { SystemRole } from "@prisma/client";
import { customZodResolver } from "@/lib/forms/zod-resolver";
import {
  createAdminUserSchema,
  type CreateAdminUserInput,
} from "../schemas/create-user";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, UserPlus } from "lucide-react";

type ActionResult = { success: true } | { success: false; error: string };

type AddUserFormProps = {
  programs: Array<{
    id: string;
    code: string;
    name: string;
    majors: Array<{ id: string; name: string }>;
  }>;
  createAction: (formData: FormData) => Promise<ActionResult>;
};

const ROLE_LABELS: Record<SystemRole, string> = {
  [SystemRole.ADMIN]: "Admin",
  [SystemRole.DEAN]: "Dean",
  [SystemRole.PROGRAM_HEAD]: "Program Head",
  [SystemRole.FACULTY]: "Faculty",
  [SystemRole.STUDENT]: "Student",
  [SystemRole.ALUMNI]: "Alumni",
  [SystemRole.INDUSTRY_PARTNER]: "Industry Partner",
};

const MULTI_SELECT_ROLES: SystemRole[] = [
  SystemRole.FACULTY,
  SystemRole.INDUSTRY_PARTNER,
];

const SINGLE_SELECT_ROLES: SystemRole[] = [
  SystemRole.STUDENT,
  SystemRole.PROGRAM_HEAD,
  SystemRole.ALUMNI,
];

function needsProgramField(role: SystemRole | undefined): "multi" | "single" | "none" {
  if (!role) return "none";
  if (MULTI_SELECT_ROLES.includes(role)) return "multi";
  if (SINGLE_SELECT_ROLES.includes(role)) return "single";
  return "none";
}

export function AddUserForm({ programs, createAction }: AddUserFormProps) {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateAdminUserInput>({
    resolver: customZodResolver(createAdminUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      role: undefined as unknown as SystemRole,
      program_ids: [],
      program_id: undefined,
      major_id: undefined,
    },
  });

  const selectedRole = watch("role");
  const selectedProgramId = watch("program_id");
  const selectedProgramIds = watch("program_ids") ?? [];
  const programMode = needsProgramField(selectedRole);

  // For single-select: resolve majors of the selected program
  // Program Head does NOT show major — one PH per program regardless of majors
  const singleProgram = programs.find((p) => p.id === selectedProgramId);
  const showMajor =
    programMode === "single" &&
    selectedRole !== SystemRole.PROGRAM_HEAD &&
    singleProgram &&
    singleProgram.majors.length > 0;

  // Lookup helpers
  const getProgramLabel = (id: string) => {
    const p = programs.find((prog) => prog.id === id);
    return p ? `${p.code} — ${p.name}` : "";
  };

  const getMajorLabel = (id: string) => {
    const m = singleProgram?.majors.find((major) => major.id === id);
    return m ? m.name : "";
  };

  const getRoleLabel = (role: SystemRole) => ROLE_LABELS[role] ?? role;

  // When role changes, reset program-related fields
  const handleRoleChange = (newRole: SystemRole) => {
    setValue("role", newRole);
    setValue("program_ids", []);
    setValue("program_id", undefined);
    setValue("major_id", undefined);
  };

  // Toggle a program in multi-select mode
  const handleToggleProgram = (programId: string) => {
    const current = selectedProgramIds;
    const next = current.includes(programId)
      ? current.filter((id) => id !== programId)
      : [...current, programId];
    setValue("program_ids", next);
  };

  const onSubmit = async (data: CreateAdminUserInput) => {
    setGlobalError(null);

    // Build FormData for the server action
    const fd = new FormData();
    fd.set("first_name", data.first_name);
    fd.set("last_name", data.last_name);
    fd.set("email", data.email);
    fd.set("role", data.role);

    if (programMode === "multi" && data.program_ids) {
      for (const pid of data.program_ids) {
        fd.append("program_ids", pid);
      }
    }

    if (programMode === "single" && data.program_id) {
      fd.set("program_id", data.program_id);
    }

    if (data.major_id) {
      fd.set("major_id", data.major_id);
    }

    const result = await createAction(fd);

    if (!result.success) {
      setGlobalError(result.error);
      return;
    }

    router.push("/admin/users");
  };

  return (
    <Card className="border-border shadow-lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6 px-6 py-8 sm:px-8">
          {/* Heading */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UserPlus className="size-5 text-primary" />
              <h2 className="text-heading-lg font-bold text-text-primary">
                Add New User
              </h2>
            </div>
            <p className="text-body-sm text-text-secondary">
              Create a new user account and assign their initial role.
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

          {/* Row 1: First Name | Last Name */}
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
                placeholder="Enter first name"
                {...register("first_name")}
                className={
                  errors.first_name ? "border-danger focus-visible:ring-danger" : ""
                }
              />
              {errors.first_name && (
                <p className="flex items-center gap-1 text-xs text-danger">
                  <AlertCircle className="size-3" />
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
                placeholder="Enter last name"
                {...register("last_name")}
                className={
                  errors.last_name ? "border-danger focus-visible:ring-danger" : ""
                }
              />
              {errors.last_name && (
                <p className="flex items-center gap-1 text-xs text-danger">
                  <AlertCircle className="size-3" />
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Email | Role */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-label-sm font-semibold uppercase tracking-wider text-text-secondary"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                {...register("email")}
                className={
                  errors.email ? "border-danger focus-visible:ring-danger" : ""
                }
              />
              {errors.email && (
                <p className="flex items-center gap-1 text-xs text-danger">
                  <AlertCircle className="size-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-label-sm font-semibold uppercase tracking-wider text-text-secondary">
                Role
              </Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => handleRoleChange(v as SystemRole)}
                    value={field.value ?? ""}
                  >
                    <SelectTrigger
                      className={`w-full ${errors.role ? "border-danger" : ""}`}
                    >
                      <SelectValue placeholder="Select a role">
                        {field.value ? getRoleLabel(field.value) : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SystemRole).map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <p className="flex items-center gap-1 text-xs text-danger">
                  <AlertCircle className="size-3" />
                  {errors.role.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 3 (conditional): Affiliated Program */}
          {programMode === "multi" && (
            <div className="space-y-2">
              <Label className="text-label-sm font-semibold uppercase tracking-wider text-text-secondary">
                Affiliated Programs
              </Label>
              <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-border p-3">
                {programs.map((program) => {
                  const isChecked = selectedProgramIds.includes(program.id);
                  return (
                    <label
                      key={program.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-muted"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleToggleProgram(program.id)}
                      />
                      <span className="text-body-sm text-text-primary">
                        {program.code} — {program.name}
                      </span>
                    </label>
                  );
                })}
                {programs.length === 0 && (
                  <p className="text-body-sm text-text-muted">
                    No active programs available.
                  </p>
                )}
              </div>
              {errors.program_ids && (
                <p className="flex items-center gap-1 text-xs text-danger">
                  <AlertCircle className="size-3" />
                  {errors.program_ids.message}
                </p>
              )}
            </div>
          )}

          {programMode === "single" && (
            <div className="space-y-2">
              <Label className="text-label-sm font-semibold uppercase tracking-wider text-text-secondary">
                Affiliated Program
              </Label>
              <Controller
                name="program_id"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      // Reset major when program changes
                      setValue("major_id", undefined);
                    }}
                    value={field.value ?? ""}
                  >
                    <SelectTrigger
                      className={`w-full ${errors.program_id ? "border-danger" : ""}`}
                    >
                      <SelectValue placeholder="Select a program">
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
          )}

          {/* Row 4 (conditional): Major */}
          {showMajor && (
            <div className="space-y-2">
              <Label className="text-label-sm font-semibold uppercase tracking-wider text-text-secondary">
                Major
              </Label>
              <Controller
                name="major_id"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <SelectTrigger
                      className={`w-full ${errors.major_id ? "border-danger" : ""}`}
                    >
                      <SelectValue placeholder="Select a major">
                        {field.value ? getMajorLabel(field.value) : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {singleProgram!.majors.map((major) => (
                        <SelectItem key={major.id} value={major.id}>
                          {major.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.major_id && (
                <p className="flex items-center gap-1 text-xs text-danger">
                  <AlertCircle className="size-3" />
                  {errors.major_id.message}
                </p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end px-6 pb-8 pt-2 sm:px-8">
          <Button
            type="submit"
            className="gap-2 font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating…" : "Create User"}
            {!isSubmitting && <UserPlus className="size-4" />}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
