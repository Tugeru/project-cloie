"use client";

import { useRef, useState, useTransition } from "react";
import { SystemRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  assignUserRoleAction,
  createExternalInviteDraftAction,
  createFacultyProgramAffiliationAction,
  createProgramHeadAssignmentAction,
  deactivateFacultyProgramAffiliationAction,
  deactivateProgramHeadAssignmentAction,
  deleteIndustryPartnerProfileAction,
  deleteStudentAcademicContextAction,
  revokeExternalInviteAction,
  revokeUserRoleAction,
  toggleUserActiveAction,
  updateStudentAcademicContextAction,
  upsertIndustryPartnerProfileAction,
} from "@/lib/actions/admin-foundation-actions";

type ProgramOption = {
  id: string;
  code: string;
  name: string;
  majors: Array<{
    id: string;
    name: string;
  }>;
};

type YearLevelOption = {
  id: string;
  name: string;
  order: number;
};

type UserItem = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  roles: Array<{
    role: SystemRole;
  }>;
  student_profile: null | {
    program_id: string;
    major_id: string | null;
    year_level_id: string;
    student_id_number: string | null;
    academic_year: string;
    is_graduating: boolean;
  };
  faculty_program_affiliations: Array<{
    id: string;
    is_active: boolean;
    program: { code: string; name: string };
  }>;
  program_head_assignments: Array<{
    id: string;
    is_active: boolean;
    program: { code: string; name: string };
  }>;
  industry_partner_profile: null | {
    company_name: string;
    position: string | null;
    program_id: string | null;
  };
};

type InviteItem = {
  id: string;
  email: string;
  role: SystemRole;
  status: string;
  invitee_name: string | null;
  company_name: string | null;
  note: string | null;
  program: { code: string; name: string } | null;
};

function formatRole(role: SystemRole) {
  return role.replaceAll("_", " ");
}

function RoleAssignmentForm({ userId, existingRoles }: { userId: string; existingRoles: SystemRole[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const availableRoles = Object.values(SystemRole).filter((role) => !existingRoles.includes(role));

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await assignUserRoleAction(formData);

      if (!result.success) {
        setError(result.error ?? "Unable to assign role.");
        return;
      }

      formRef.current?.reset();
      router.refresh();
    });
  }

  if (availableRoles.length === 0) {
    return <p className="text-xs text-text-muted">All system roles are already assigned.</p>;
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2">
      <input type="hidden" name="user_id" value={userId} />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor={`role-${userId}`} className="text-xs">
            Assign Role
          </Label>
          <select
            id={`role-${userId}`}
            name="role"
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            defaultValue={availableRoles[0]}
          >
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {formatRole(role)}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Assign"}
        </Button>
      </div>
    </form>
  );
}

function StudentContextForm({
  user,
  programs,
  yearLevels,
}: {
  user: UserItem;
  programs: ProgramOption[];
  yearLevels: YearLevelOption[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const majors = programs.flatMap((program) =>
    program.majors.map((major) => ({
      id: major.id,
      label: `${program.code} - ${major.name}`,
    })),
  );

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateStudentAcademicContextAction(formData);

      if (!result.success) {
        setError(result.error ?? "Unable to save student context.");
        return;
      }

      router.refresh();
    });
  }

  function handleDeleteContext() {
    if (!confirm("Remove this student academic context?")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteStudentAcademicContextAction(user.id);

      if (!result.success) {
        alert(result.error);
        return;
      }

      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3 rounded-xl border border-border p-4">
      <input type="hidden" name="user_id" value={user.id} />
      <div className="space-y-1">
        <p className="text-sm font-semibold">Student Academic Context</p>
        <p className="text-xs text-text-muted">
          Program, optional major, year level, academic year, and graduating eligibility.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`student-program-${user.id}`} className="text-xs">
            Program
          </Label>
          <select
            id={`student-program-${user.id}`}
            name="program_id"
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
            defaultValue={user.student_profile?.program_id ?? ""}
            required
          >
            <option value="" disabled>
              Select program
            </option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.code} - {program.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`student-major-${user.id}`} className="text-xs">
            Major
          </Label>
          <select
            id={`student-major-${user.id}`}
            name="major_id"
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
            defaultValue={user.student_profile?.major_id ?? ""}
          >
            <option value="">Program-wide / none</option>
            {majors.map((major) => (
              <option key={major.id} value={major.id}>
                {major.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`student-year-${user.id}`} className="text-xs">
            Year Level
          </Label>
          <select
            id={`student-year-${user.id}`}
            name="year_level_id"
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
            defaultValue={user.student_profile?.year_level_id ?? ""}
            required
          >
            <option value="" disabled>
              Select year level
            </option>
            {yearLevels.map((yearLevel) => (
              <option key={yearLevel.id} value={yearLevel.id}>
                {yearLevel.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`student-academic-year-${user.id}`} className="text-xs">
            Academic Year
          </Label>
          <Input
            id={`student-academic-year-${user.id}`}
            name="academic_year"
            placeholder="2026-2027"
            defaultValue={user.student_profile?.academic_year ?? ""}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`student-number-${user.id}`} className="text-xs">
            Student ID Number
          </Label>
          <Input
            id={`student-number-${user.id}`}
            name="student_id_number"
            placeholder="2023-00001"
            defaultValue={user.student_profile?.student_id_number ?? ""}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_graduating"
          value="true"
          defaultChecked={user.student_profile?.is_graduating ?? false}
        />
        Graduating student
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Save Student Context"}
        </Button>
        {user.student_profile && (
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleDeleteContext}>
            Remove Context
          </Button>
        )}
      </div>
    </form>
  );
}

function ProgramLinkForm({
  userId,
  label,
  fieldName,
  programs,
  action,
}: {
  userId: string;
  label: string;
  fieldName: "faculty_id" | "program_head_id";
  programs: ProgramOption[];
  action: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await action(formData);

      if (!result.success) {
        setError(result.error ?? `Unable to save ${label.toLowerCase()}.`);
        return;
      }

      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2">
      <input type="hidden" name={fieldName} value={userId} />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor={`${fieldName}-${userId}`} className="text-xs">
            {label}
          </Label>
          <select
            id={`${fieldName}-${userId}`}
            name="program_id"
            className="h-9 min-w-52 rounded-lg border border-input bg-transparent px-3 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Select program
            </option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.code} - {program.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Add"}
        </Button>
      </div>
    </form>
  );
}

function IndustryProfileForm({
  user,
  programs,
}: {
  user: UserItem;
  programs: ProgramOption[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await upsertIndustryPartnerProfileAction(formData);

      if (!result.success) {
        setError(result.error ?? "Unable to save industry profile.");
        return;
      }

      router.refresh();
    });
  }

  function handleDeleteProfile() {
    if (!confirm("Remove this industry partner profile?")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteIndustryPartnerProfileAction(user.id);

      if (!result.success) {
        alert(result.error);
        return;
      }

      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3 rounded-xl border border-border p-4">
      <input type="hidden" name="user_id" value={user.id} />
      <div className="space-y-1">
        <p className="text-sm font-semibold">Industry Partner Profile</p>
        <p className="text-xs text-text-muted">
          Track company details and optional program alignment for invite-backed responses.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`company-name-${user.id}`} className="text-xs">
            Company Name
          </Label>
          <Input
            id={`company-name-${user.id}`}
            name="company_name"
            placeholder="ACD Partner Company"
            defaultValue={user.industry_partner_profile?.company_name ?? ""}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`company-position-${user.id}`} className="text-xs">
            Position
          </Label>
          <Input
            id={`company-position-${user.id}`}
            name="position"
            placeholder="HR Manager"
            defaultValue={user.industry_partner_profile?.position ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`industry-program-${user.id}`} className="text-xs">
          Program Context
        </Label>
        <select
          id={`industry-program-${user.id}`}
          name="program_id"
          className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
          defaultValue={user.industry_partner_profile?.program_id ?? ""}
        >
          <option value="">No specific program</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.code} - {program.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Save Industry Profile"}
        </Button>
        {user.industry_partner_profile && (
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleDeleteProfile}>
            Remove Profile
          </Button>
        )}
      </div>
    </form>
  );
}

function ExternalInviteForm({ programs }: { programs: ProgramOption[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createExternalInviteDraftAction(formData);

      if (!result.success) {
        setError(result.error ?? "Unable to create invite draft.");
        return;
      }

      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input id="invite-email" name="email" type="email" placeholder="name@example.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-role">Role</Label>
          <select
            id="invite-role"
            name="role"
            className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
            defaultValue={SystemRole.ALUMNI}
          >
            <option value={SystemRole.ALUMNI}>Alumni</option>
            <option value={SystemRole.INDUSTRY_PARTNER}>Industry Partner</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-name">Invitee Name</Label>
          <Input id="invite-name" name="invitee_name" placeholder="Juan Dela Cruz" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-company">Company</Label>
          <Input id="invite-company" name="company_name" placeholder="ACD Partner Company" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-program">Program Context</Label>
        <select
          id="invite-program"
          name="program_id"
          className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
          defaultValue=""
        >
          <option value="">College-wide / no program</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.code} - {program.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-note">Notes</Label>
        <Textarea
          id="invite-note"
          name="note"
          rows={3}
          placeholder="Invitation context, ownership notes, and outreach assumptions..."
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Create Invite Draft"}
      </Button>
    </form>
  );
}

export function AdminUserManagement({
  users,
  programs,
  yearLevels,
  invites,
}: {
  users: UserItem[];
  programs: ProgramOption[];
  yearLevels: YearLevelOption[];
  invites: InviteItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggleUser(userId: string, nextActive: boolean) {
    startTransition(async () => {
      const result = await toggleUserActiveAction(userId, nextActive);

      if (!result.success) {
        alert(result.error);
        return;
      }

      router.refresh();
    });
  }

  function handleRevokeRole(userId: string, role: SystemRole) {
    if (!confirm(`Revoke the ${formatRole(role)} role from this user?`)) {
      return;
    }

    startTransition(async () => {
      const result = await revokeUserRoleAction(userId, role);

      if (!result.success) {
        alert(result.error);
        return;
      }

      router.refresh();
    });
  }

  function handleDeactivateFacultyAffiliation(id: string) {
    startTransition(async () => {
      const result = await deactivateFacultyProgramAffiliationAction(id);

      if (!result.success) {
        alert(result.error);
        return;
      }

      router.refresh();
    });
  }

  function handleDeactivateProgramHeadAssignment(id: string) {
    startTransition(async () => {
      const result = await deactivateProgramHeadAssignmentAction(id);

      if (!result.success) {
        alert(result.error);
        return;
      }

      router.refresh();
    });
  }

  function handleRevokeInvite(id: string) {
    if (!confirm("Revoke this invite draft?")) {
      return;
    }

    startTransition(async () => {
      const result = await revokeExternalInviteAction(id);

      if (!result.success) {
        alert(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>External Invite Drafts</CardTitle>
            <CardDescription>
              Prepare alumni and industry-partner outreach records before email delivery is wired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExternalInviteForm programs={programs} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Invite Queue</CardTitle>
            <CardDescription>
              Draft and revoked invites are tracked here for MVP admin visibility.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {invites.length === 0 && (
              <p className="text-sm text-text-muted">No invite drafts yet.</p>
            )}
            {invites.map((invite) => (
              <div key={invite.id} className="rounded-xl border border-border px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium">{invite.invitee_name ?? invite.email}</p>
                    <p className="text-sm text-text-muted">{invite.email}</p>
                    <p className="text-xs text-text-secondary">
                      {formatRole(invite.role)}
                      {invite.program ? ` • ${invite.program.code}` : " • College-wide"}
                      {invite.company_name ? ` • ${invite.company_name}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={invite.status === "DRAFT" ? "default" : "secondary"}>
                      {invite.status}
                    </Badge>
                    {invite.status !== "REVOKED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleRevokeInvite(invite.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
                {invite.note && <p className="mt-2 text-sm text-text-muted">{invite.note}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {users.map((user) => {
          const userRoles = user.roles.map((role) => role.role);
          const hasStudentRole = userRoles.includes(SystemRole.STUDENT);
          const hasFacultyRole = userRoles.includes(SystemRole.FACULTY);
          const hasProgramHeadRole = userRoles.includes(SystemRole.PROGRAM_HEAD);
          const hasIndustryRole = userRoles.includes(SystemRole.INDUSTRY_PARTNER);

          return (
            <Card key={user.id} className={!user.is_active ? "opacity-80" : ""}>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>
                      {user.first_name} {user.last_name}
                    </CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleToggleUser(user.id, !user.is_active)}
                    >
                      {user.is_active ? "Deactivate User" : "Reactivate User"}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {userRoles.length === 0 && <Badge variant="secondary">No roles</Badge>}
                  {userRoles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium"
                    >
                      {formatRole(role)}
                      <button
                        type="button"
                        className="text-text-muted transition-colors hover:text-danger"
                        disabled={isPending}
                        onClick={() => handleRevokeRole(user.id, role)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <RoleAssignmentForm userId={user.id} existingRoles={userRoles} />

                {(hasStudentRole || user.student_profile) && (
                  <StudentContextForm user={user} programs={programs} yearLevels={yearLevels} />
                )}

                {(hasFacultyRole || user.faculty_program_affiliations.length > 0) && (
                  <section className="space-y-3 rounded-xl border border-border p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Faculty Program Affiliations</p>
                      <p className="text-xs text-text-muted">
                        Control the scoped program catalog available during faculty publishing.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {user.faculty_program_affiliations.length === 0 && (
                        <p className="text-xs text-text-muted">No affiliations yet.</p>
                      )}
                      {user.faculty_program_affiliations.map((affiliation) => (
                        <span
                          key={affiliation.id}
                          className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs"
                        >
                          {affiliation.program.code}
                          {!affiliation.is_active && " (inactive)"}
                          {affiliation.is_active && (
                            <button
                              type="button"
                              className="text-text-muted transition-colors hover:text-danger"
                              disabled={isPending}
                              onClick={() => handleDeactivateFacultyAffiliation(affiliation.id)}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>

                    <ProgramLinkForm
                      userId={user.id}
                      label="Add Program Affiliation"
                      fieldName="faculty_id"
                      programs={programs}
                      action={createFacultyProgramAffiliationAction}
                    />
                  </section>
                )}

                {(hasProgramHeadRole || user.program_head_assignments.length > 0) && (
                  <section className="space-y-3 rounded-xl border border-border p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Program Head Assignments</p>
                      <p className="text-xs text-text-muted">
                        Define the program scope available in the leadership portal.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {user.program_head_assignments.length === 0 && (
                        <p className="text-xs text-text-muted">No program-head assignments yet.</p>
                      )}
                      {user.program_head_assignments.map((assignment) => (
                        <span
                          key={assignment.id}
                          className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs"
                        >
                          {assignment.program.code}
                          {!assignment.is_active && " (inactive)"}
                          {assignment.is_active && (
                            <button
                              type="button"
                              className="text-text-muted transition-colors hover:text-danger"
                              disabled={isPending}
                              onClick={() => handleDeactivateProgramHeadAssignment(assignment.id)}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>

                    <ProgramLinkForm
                      userId={user.id}
                      label="Add Program Assignment"
                      fieldName="program_head_id"
                      programs={programs}
                      action={createProgramHeadAssignmentAction}
                    />
                  </section>
                )}

                {(hasIndustryRole || user.industry_partner_profile) && (
                  <IndustryProfileForm user={user} programs={programs} />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
