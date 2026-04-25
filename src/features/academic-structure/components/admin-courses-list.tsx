"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CourseScope } from "@prisma/client";
import {
  BookOpen,
  GraduationCap,
  Layers,
  MoreVertical,
  Search,
  Library,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import {
  toggleCourseActiveAction,
  deleteCourseAction,
} from "@/lib/actions/admin-foundation-actions";

import type {
  AdminCourseSummaryItem,
  AdminCoursesKPI,
  ProgramFilterOption,
} from "@/features/academic-structure/services/list-admin-courses-summary";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 15;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type AdminCoursesListProps = {
  courses: AdminCourseSummaryItem[];
  kpi: AdminCoursesKPI;
  programs: ProgramFilterOption[];
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminCoursesList({ courses, kpi, programs }: AdminCoursesListProps) {
  // ---- Filter state -------------------------------------------------------
  const [scopeFilter, setScopeFilter] = useState<string>("__all__");
  const [programFilter, setProgramFilter] = useState<string>("__all__");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // ---- Filtered courses ----------------------------------------------------
  const filteredCourses = useMemo(() => {
    let result = courses;

    // Scope filter
    if (scopeFilter === "general_education") {
      result = result.filter(
        (c) => c.courseScope === CourseScope.GENERAL_EDUCATION,
      );
    } else if (scopeFilter === "program_specific") {
      result = result.filter(
        (c) => c.courseScope === CourseScope.PROGRAM_SPECIFIC,
      );
    }

    // Program filter
    if (programFilter !== "__all__") {
      result = result.filter((c) => c.programId === programFilter);
    }

    // Search by code or title
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(term) ||
          c.title.toLowerCase().includes(term),
      );
    }

    return result;
  }, [courses, scopeFilter, programFilter, searchTerm]);

  // ---- Pagination ----------------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCourses = filteredCourses.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // Reset to page 1 when filters change
  const handleScopeChange = (value: string | null) => {
    setScopeFilter(value ?? "__all__");
    setCurrentPage(1);
  };

  const handleProgramChange = (value: string | null) => {
    setProgramFilter(value ?? "__all__");
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // ---- Action handlers -----------------------------------------------------
  const handleToggleActive = (courseId: string, currentActive: boolean) => {
    startTransition(async () => {
      await toggleCourseActiveAction(courseId, !currentActive);
    });
  };

  const handleDelete = (courseId: string, courseCode: string) => {
    if (!window.confirm(`Delete course "${courseCode}"? This cannot be undone.`)) {
      return;
    }
    startTransition(async () => {
      await deleteCourseAction(courseId);
    });
  };

  // ---- Pagination helpers --------------------------------------------------
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

  // ---- Render --------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-heading-lg">Courses</h1>
        <p className="text-body-md text-text-secondary">
          Manage the shared course catalog for general education, program-wide,
          and major-specific contexts.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total Courses"
          value={kpi.totalCourses}
          icon={<BookOpen className="size-5 text-muted-foreground" />}
        />
        <KPICard
          label="Active Courses"
          value={kpi.activeCourses}
          icon={<Layers className="size-5 text-muted-foreground" />}
        />
        <KPICard
          label="General Education"
          value={kpi.generalEducationCourses}
          icon={<Library className="size-5 text-muted-foreground" />}
        />
        <KPICard
          label="Program-Specific"
          value={kpi.programSpecificCourses}
          icon={<GraduationCap className="size-5 text-muted-foreground" />}
        />
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-end">
        <Button render={<Link href="/admin/courses/new" />}>
          Create Course
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Scope filter */}
        <Select value={scopeFilter} onValueChange={handleScopeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue>
              {scopeFilter === "__all__"
                ? "All Scopes"
                : scopeFilter === "general_education"
                  ? "General Education"
                  : "Program-Specific"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Scopes</SelectItem>
            <SelectItem value="general_education">General Education</SelectItem>
            <SelectItem value="program_specific">Program-Specific</SelectItem>
          </SelectContent>
        </Select>

        {/* Program filter */}
        <Select value={programFilter} onValueChange={handleProgramChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue>
              {programFilter === "__all__"
                ? "All Programs"
                : programs.find((p) => p.id === programFilter)?.code ??
                  "All Programs"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Programs</SelectItem>
            {programs.map((program) => (
              <SelectItem key={program.id} value={program.id}>
                {program.code} – {program.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by code or title..."
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
            <TableHead>Code</TableHead>
            <TableHead>Course Title</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Program</TableHead>
            <TableHead>Major</TableHead>
            <TableHead className="text-right">CILOs</TableHead>
            <TableHead className="text-right">Evaluations</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedCourses.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="h-24 text-center text-muted-foreground"
              >
                No courses found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedCourses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-bold">{course.code}</TableCell>
                <TableCell>{course.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{course.courseScopeLabel}</Badge>
                </TableCell>
                <TableCell>
                  {course.programCode ?? "—"}
                </TableCell>
                <TableCell>
                  {course.majorName ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {course.ciloCount}
                </TableCell>
                <TableCell className="text-right">
                  {course.evaluationCount}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={course.isActive ? "default" : "secondary"}
                  >
                    {course.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary">
                      <MoreVertical className="size-4" />
                      <span className="sr-only">Actions</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        render={
                          <Link href={`/admin/courses/${course.id}/edit`} />
                        }
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={isPending}
                        onClick={() =>
                          handleToggleActive(course.id, course.isActive)
                        }
                      >
                        {course.isActive ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={isPending}
                        onClick={() => handleDelete(course.id, course.code)}
                        className="text-destructive focus:text-destructive"
                      >
                        Delete
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
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-sm text-muted-foreground"
              >
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
            ),
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
      <p className="text-center text-xs text-muted-foreground">
        Showing {(safePage - 1) * PAGE_SIZE + 1}–
        {Math.min(safePage * PAGE_SIZE, filteredCourses.length)} of{" "}
        {filteredCourses.length} course
        {filteredCourses.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Card sub-component
// ---------------------------------------------------------------------------

function KPICard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-semibold uppercase tracking-wider">
            {label}
          </CardDescription>
          {icon}
        </div>
        <CardTitle className="text-2xl font-bold">
          {value.toLocaleString()}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
