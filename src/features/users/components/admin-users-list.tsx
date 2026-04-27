"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { SystemRole } from "@prisma/client";
import {
  MoreVertical,
  Search,
  Users,
  GraduationCap,
  Briefcase,
  UserCheck,
  X,
  Mail,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toggleUserActiveAction } from "@/lib/actions/admin-foundation-actions";
import { updateAdminUserAction } from "@/lib/actions/admin-user-crud-actions";

import type {
  AdminUserSummaryItem,
  AdminUsersKPI,
} from "@/features/users/services/list-admin-users-summary";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 15;

const ALL_ROLES: SystemRole[] = [
  SystemRole.ADMIN,
  SystemRole.DEAN,
  SystemRole.PROGRAM_HEAD,
  SystemRole.FACULTY,
  SystemRole.STUDENT,
  SystemRole.ALUMNI,
  SystemRole.INDUSTRY_PARTNER,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format `PROGRAM_HEAD` → `"Program Head"` */
function formatRole(role: SystemRole): string {
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type AdminUsersListProps = {
  users: AdminUserSummaryItem[];
  kpi: AdminUsersKPI;
  programs: Array<{
    id: string;
    code: string;
    name: string;
    majors: Array<{ id: string; name: string }>;
  }>;
};

// ---------------------------------------------------------------------------
// View User Dialog
// ---------------------------------------------------------------------------

function ViewUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUserSummaryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Viewing information for {user.firstName} {user.lastName}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
              Full Name
            </label>
            <p className="text-sm font-semibold">
              {user.firstName} {user.lastName}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
              Email Address
            </label>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Mail className="text-muted-foreground size-4" />
              {user.email}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
              Role
            </label>
            <div className="flex flex-wrap gap-1.5">
              {user.roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {formatRole(role)}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
              Affiliated Program
            </label>
            <p className="text-sm font-semibold">{user.programLabel || "—"}</p>
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
              Major
            </label>
            <p className="text-sm font-semibold">{user.majorLabel || "—"}</p>
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
              Status
            </label>
            <div>
              <Badge variant={user.isActive ? "default" : "secondary"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Edit User Dialog
// ---------------------------------------------------------------------------

function EditUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUserSummaryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateAdminUserAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update details for {user.firstName} {user.lastName}.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-2">
          <input type="hidden" name="id" value={user.id} />

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-first-name">First Name</Label>
            <Input id="edit-first-name" name="first_name" defaultValue={user.firstName} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-last-name">Last Name</Label>
            <Input id="edit-last-name" name="last_name" defaultValue={user.lastName} required />
          </div>

          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input value={user.email} disabled className="opacity-60" />
            <p className="text-muted-foreground text-xs">Email cannot be changed.</p>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex flex-wrap gap-1.5">
              {user.roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {formatRole(role)}
                </Badge>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">Roles are managed separately.</p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminUsersList({ users, kpi, programs }: AdminUsersListProps) {
  // ---- Filter state -------------------------------------------------------
  const [roleFilter, setRoleFilter] = useState<string>("__all__");
  const [programFilter, setProgramFilter] = useState<string>("__all__");
  const [majorFilter, setMajorFilter] = useState<string>("__all__");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // ---- Modal state ---------------------------------------------------------
  const [viewUser, setViewUser] = useState<AdminUserSummaryItem | null>(null);
  const [editUser, setEditUser] = useState<AdminUserSummaryItem | null>(null);

  // ---- Derived: majors for selected program --------------------------------
  const selectedProgramMajors = useMemo(() => {
    if (programFilter === "__all__") return [];
    const prog = programs.find((p) => p.code === programFilter);
    return prog?.majors ?? [];
  }, [programFilter, programs]);

  // Reset major filter when program changes
  const handleProgramChange = (value: string | null) => {
    setProgramFilter(value ?? "__all__");
    setMajorFilter("__all__");
    setCurrentPage(1);
  };

  // ---- Filtered users ------------------------------------------------------
  const filteredUsers = useMemo(() => {
    let result = users;

    // Role filter
    if (roleFilter !== "__all__") {
      result = result.filter((u) => u.roles.includes(roleFilter as SystemRole));
    }

    // Program filter
    if (programFilter !== "__all__") {
      result = result.filter((u) => u.programLabel.includes(programFilter));
    }

    // Major filter
    if (majorFilter !== "__all__") {
      result = result.filter((u) => u.majorLabel === majorFilter);
    }

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)
      );
    }

    return result;
  }, [users, roleFilter, programFilter, majorFilter, searchTerm]);

  // ---- Pagination -----------------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when filters change
  const handleRoleChange = (value: string | null) => {
    setRoleFilter(value ?? "__all__");
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleMajorChange = (value: string | null) => {
    setMajorFilter(value ?? "__all__");
    setCurrentPage(1);
  };

  // ---- Action handlers ------------------------------------------------------
  const handleToggleActive = (userId: string, currentActive: boolean) => {
    startTransition(async () => {
      await toggleUserActiveAction(userId, !currentActive);
    });
  };

  // ---- Pagination helpers ---------------------------------------------------
  function buildPageNumbers(): (number | "ellipsis")[] {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("ellipsis");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  }

  // ---- Render ---------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-heading-lg">User Management</h1>
        <p className="text-body-md text-text-secondary">
          Manage role assignments, academic context, and stakeholder records.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total Users"
          value={kpi.totalUsers}
          icon={<Users className="text-muted-foreground size-5" />}
        />
        <KPICard
          label="Total Students"
          value={kpi.totalStudents}
          icon={<GraduationCap className="text-muted-foreground size-5" />}
        />
        <KPICard
          label="Total Alumni"
          value={kpi.totalAlumni}
          icon={<UserCheck className="text-muted-foreground size-5" />}
        />
        <KPICard
          label="Total Industry Partners"
          value={kpi.totalIndustryPartners}
          icon={<Briefcase className="text-muted-foreground size-5" />}
        />
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-end">
        <Button render={<Link href="/admin/users/new" />}>Add New User</Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Role filter */}
        <Select value={roleFilter} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue>
              {roleFilter === "__all__" ? "All Roles" : formatRole(roleFilter as SystemRole)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Roles</SelectItem>
            {ALL_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {formatRole(role)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Program filter */}
        <Select value={programFilter} onValueChange={handleProgramChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue>
              {programFilter === "__all__" ? "All Programs" : programFilter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Programs</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.code}>
                {p.code} — {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Major filter — only shown when selected program has majors */}
        {selectedProgramMajors.length > 0 && (
          <Select value={majorFilter} onValueChange={handleMajorChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue>{majorFilter === "__all__" ? "All Majors" : majorFilter}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Majors</SelectItem>
              {selectedProgramMajors.map((m) => (
                <SelectItem key={m.id} value={m.name}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Search */}
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Data table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Affiliated Program</TableHead>
            <TableHead>Major</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground h-24 text-center">
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>
                  {user.primaryRole ? (
                    <Badge variant="secondary">{formatRole(user.primaryRole)}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{user.programLabel}</TableCell>
                <TableCell>{user.majorLabel}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="text-text-muted hover:bg-surface-muted hover:text-text-primary inline-flex size-8 items-center justify-center rounded-md transition-colors">
                      <MoreVertical className="size-4" />
                      <span className="sr-only">Actions</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewUser(user)}>View</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditUser(user)}>Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={isPending}
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            ←
          </Button>

          {buildPageNumbers().map((page, idx) =>
            page === "ellipsis" ? (
              <span key={`ellipsis-${idx}`} className="text-muted-foreground px-2 text-sm">
                …
              </span>
            ) : (
              <Button
                key={page}
                variant={page === safePage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            →
          </Button>
        </div>
      )}

      {/* Result count */}
      <p className="text-muted-foreground text-center text-xs">
        Showing {(safePage - 1) * PAGE_SIZE + 1}–
        {Math.min(safePage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} user
        {filteredUsers.length !== 1 ? "s" : ""}
      </p>

      {/* View User Dialog */}
      {viewUser && (
        <ViewUserDialog
          user={viewUser}
          open={!!viewUser}
          onOpenChange={(open) => {
            if (!open) setViewUser(null);
          }}
        />
      )}

      {/* Edit User Dialog */}
      {editUser && (
        <EditUserDialog
          user={editUser}
          open={!!editUser}
          onOpenChange={(open) => {
            if (!open) setEditUser(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Card sub-component
// ---------------------------------------------------------------------------

function KPICard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-semibold tracking-wider uppercase">
            {label}
          </CardDescription>
          {icon}
        </div>
        <CardTitle className="text-2xl font-bold">{value.toLocaleString()}</CardTitle>
      </CardHeader>
    </Card>
  );
}
