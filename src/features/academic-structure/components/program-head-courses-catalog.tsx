"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CourseScope } from "@prisma/client";
import { Archive, Edit, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  createProgramHeadCourseAction,
  toggleProgramHeadCourseActiveAction,
  updateProgramHeadCourseAction,
} from "@/lib/actions/program-head-course-actions";
import type {
  ProgramHeadCourseItem,
  ProgramHeadCourseSummary,
} from "../services/resolve-program-head-courses";

type ProgramHeadCoursesCatalogProps = {
  courses: ProgramHeadCourseItem[];
  summary: ProgramHeadCourseSummary;
  programs: Array<{ id: string; code: string; name: string }>;
  majors: Array<{ id: string; name: string; program_id: string }>;
};

type CourseFormMode = "create" | "edit";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCourseTypeLabel(course: ProgramHeadCourseItem): string {
  if (course.course_scope === CourseScope.GENERAL_EDUCATION) {
    return "General Education";
  }

  return course.major_id ? "Major-Specific" : "Program-Wide";
}

function filterCourses(
  courses: ProgramHeadCourseItem[],
  tab: string,
  search: string,
  majorFilter: string,
): ProgramHeadCourseItem[] {
  let filtered = courses;

  // Filter by tab
  switch (tab) {
    case "program-wide":
      filtered = filtered.filter(
        (c) =>
          c.course_scope === CourseScope.PROGRAM_SPECIFIC &&
          !c.major_id &&
          c.is_active,
      );
      break;
    case "major-specific":
      filtered = filtered.filter(
        (c) =>
          c.course_scope === CourseScope.PROGRAM_SPECIFIC &&
          c.major_id !== null &&
          c.is_active,
      );
      break;
    case "gen-ed":
      filtered = filtered.filter(
        (c) => c.course_scope === CourseScope.GENERAL_EDUCATION && c.is_active,
      );
      break;
    case "archived":
      filtered = filtered.filter((c) => !c.is_active);
      break;
    default: // "all"
      filtered = filtered.filter((c) => c.is_active);
      break;
  }

  // Filter by search
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q),
    );
  }

  // Filter by major
  if (majorFilter && majorFilter !== "all") {
    filtered = filtered.filter((c) => c.major_id === majorFilter);
  }

  return filtered;
}

function StatCard({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className="flex h-28 flex-col justify-between rounded-lg border border-border bg-surface p-5 transition-colors hover:bg-surface-alt">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span
        className={`font-heading text-3xl font-bold ${muted ? "text-text-muted" : "text-text-primary"}`}
      >
        {value}
      </span>
    </div>
  );
}

function CourseFormDialog({
  mode,
  majors,
  course,
  open,
  onOpenChange,
}: {
  mode: CourseFormMode;
  majors: Array<{ id: string; name: string; program_id: string }>;
  course?: ProgramHeadCourseItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [scopeType, setScopeType] = useState<"program-wide" | "major-specific">(
    course?.major_id ? "major-specific" : "program-wide",
  );

  function handleSubmit(formData: FormData) {
    setError(null);

    // Set course_scope always to PROGRAM_SPECIFIC for PH
    formData.set("course_scope", CourseScope.PROGRAM_SPECIFIC);

    // Clear major_id if program-wide
    if (scopeType === "program-wide") {
      formData.delete("major_id");
    }

    startTransition(async () => {
      const action =
        mode === "create"
          ? createProgramHeadCourseAction
          : updateProgramHeadCourseAction;

      const result = await action(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Course" : "Edit Course"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new course within your program scope."
              : "Update course details."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {mode === "edit" && course && (
            <input type="hidden" name="id" value={course.id} />
          )}

          {error && (
            <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="scope-type">Course Scope</Label>
            <Select
              value={scopeType}
              onValueChange={(v) =>
                setScopeType(v as "program-wide" | "major-specific")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="program-wide">Program-Wide</SelectItem>
                {majors.length > 0 && (
                  <SelectItem value="major-specific">
                    Major-Specific
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {scopeType === "major-specific" && majors.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="major_id">Major</Label>
              <Select
                name="major_id"
                defaultValue={course?.major_id ?? undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select major" />
                </SelectTrigger>
                <SelectContent>
                  {majors.map((major) => (
                    <SelectItem key={major.id} value={major.id}>
                      {major.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="code">Course Code</Label>
            <Input
              id="code"
              name="code"
              placeholder="e.g. IT-204"
              defaultValue={course?.code ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Course Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Data Structures & Algorithms"
              defaultValue={course?.title ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief course description..."
              defaultValue={course?.description ?? ""}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : mode === "create"
                  ? "Create Course"
                  : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProgramHeadCoursesCatalog({
  courses,
  summary,
  programs,
  majors,
}: ProgramHeadCoursesCatalogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [majorFilter, setMajorFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<ProgramHeadCourseItem | null>(
    null,
  );

  const filteredCourses = filterCourses(courses, activeTab, search, majorFilter);
  const programLabel = programs.map((p) => p.name).join(", ") || "No Program";

  function handleToggleActive(id: string, currentActive: boolean) {
    startTransition(async () => {
      await toggleProgramHeadCourseActiveAction(id, !currentActive);
      router.refresh();
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-2 font-heading text-4xl font-bold tracking-tight text-text-primary lg:text-5xl">
            Courses
          </h1>
          <div className="flex items-center gap-3">
            <span className="font-heading text-xl font-medium text-primary">
              {programLabel}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
            <span className="text-body-md text-text-muted">
              Manage courses for this program only
            </span>
          </div>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Total Courses" value={summary.total} />
        <StatCard label="Program-Wide" value={summary.programWide} />
        <StatCard label="Major-Specific" value={summary.majorSpecific} />
        <StatCard label="Gen Ed" value={summary.generalEducation} />
        <StatCard label="Archived" value={summary.archived} muted />
      </div>

      {/* Content Container */}
      <div className="rounded-xl bg-surface-alt p-2">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-4 border-b border-border px-4 pt-2">
            <TabsList className="h-auto bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="rounded-none border-b-2 border-transparent px-1 pb-3 text-sm font-medium tracking-wide data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                All Courses
              </TabsTrigger>
              <TabsTrigger
                value="program-wide"
                className="rounded-none border-b-2 border-transparent px-1 pb-3 text-sm font-medium tracking-wide data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                Program-Wide
              </TabsTrigger>
              <TabsTrigger
                value="major-specific"
                className="rounded-none border-b-2 border-transparent px-1 pb-3 text-sm font-medium tracking-wide data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                Major-Specific
              </TabsTrigger>
              <TabsTrigger
                value="gen-ed"
                className="rounded-none border-b-2 border-transparent px-1 pb-3 text-sm font-medium tracking-wide data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                Gen Ed
              </TabsTrigger>
              <TabsTrigger
                value="archived"
                className="rounded-none border-b-2 border-transparent px-1 pb-3 text-sm font-medium tracking-wide data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                Archived
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Filters */}
          <div className="flex flex-col items-start justify-between gap-4 px-4 pb-4 lg:flex-row lg:items-center">
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                className="pl-9"
                placeholder="Search course code or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {majors.length > 0 && (
                <Select value={majorFilter} onValueChange={(v) => setMajorFilter(v ?? "all")}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Majors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Majors</SelectItem>
                    {majors.map((major) => (
                      <SelectItem key={major.id} value={major.id}>
                        {major.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium uppercase tracking-wider">
                      Code
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider">
                      Title
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider">
                      Type
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider">
                      Major Scope
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider">
                      Last Updated
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-12 text-center text-text-muted"
                      >
                        No courses found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCourses.map((course) => (
                      <TableRow key={course.id} className="group">
                        <TableCell className="whitespace-nowrap font-heading text-sm font-semibold text-text-primary">
                          {course.code}
                        </TableCell>
                        <TableCell className="text-sm text-text-primary">
                          {course.title}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-text-secondary">
                          {getCourseTypeLabel(course)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {course.major ? (
                            <Badge variant="secondary" className="text-xs">
                              {course.major.name}
                            </Badge>
                          ) : course.program ? (
                            <Badge variant="outline" className="text-xs">
                              {course.program.code}
                            </Badge>
                          ) : (
                            <span className="text-xs text-text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant={course.is_active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {course.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-text-muted">
                          {formatDate(course.updated_at)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {!course.isReadOnly && (
                            <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Edit"
                                onClick={() => setEditingCourse(course)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title={
                                  course.is_active ? "Archive" : "Restore"
                                }
                                disabled={isPending}
                                onClick={() =>
                                  handleToggleActive(
                                    course.id,
                                    course.is_active,
                                  )
                                }
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {course.isReadOnly && (
                            <span className="text-xs text-text-muted">
                              Read-only
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Create Dialog */}
      <CourseFormDialog
        mode="create"
        majors={majors}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Dialog */}
      {editingCourse && (
        <CourseFormDialog
          mode="edit"
          majors={majors}
          course={editingCourse}
          open={!!editingCourse}
          onOpenChange={(open) => {
            if (!open) setEditingCourse(null);
          }}
        />
      )}
    </div>
  );
}
