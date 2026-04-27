"use client";

import { AcademicSemester, AcademicTerm } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FacultyAnalyticsFilters } from "../services/list-faculty-analytics-evaluations";

type FacultyAnalyticsFiltersProps = {
  filters: FacultyAnalyticsFilters;
  onChange: (filters: FacultyAnalyticsFilters) => void;
  availableAcademicYears: string[];
  availableCourses: { id: string; label: string }[];
};

const SEMESTER_OPTIONS = [
  { value: "FIRST", label: "First Semester" },
  { value: "SECOND", label: "Second Semester" },
  { value: "SUMMER", label: "Summer" },
];

const TERM_OPTIONS = [
  { value: "FIRST_TERM", label: "First Term" },
  { value: "SECOND_TERM", label: "Second Term" },
  { value: "WHOLE_SEMESTER", label: "Whole Semester" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "CLOSED", label: "Closed" },
  { value: "ARCHIVED", label: "Archived" },
];

export function FacultyAnalyticsFilters({
  filters,
  onChange,
  availableAcademicYears,
  availableCourses,
}: FacultyAnalyticsFiltersProps) {
  const handleClear = () => {
    onChange({});
  };

  const hasFilters =
    filters.academicYear ||
    filters.semester ||
    filters.term ||
    (filters.courseIds && filters.courseIds.length > 0) ||
    (filters.statuses && filters.statuses.length > 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Academic Year */}
        <div className="space-y-2">
          <label className="text-xs font-medium">Academic Year</label>
          <Select
            value={filters.academicYear ?? "all"}
            onValueChange={(value) =>
              onChange({ ...filters, academicYear: value === "all" || !value ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableAcademicYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Semester */}
        <div className="space-y-2">
          <label className="text-xs font-medium">Semester</label>
          <Select
            value={filters.semester ?? "all"}
            onValueChange={(value) =>
              onChange({
                ...filters,
                semester: value === "all" ? undefined : (value as AcademicSemester),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Semesters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {SEMESTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Term */}
        <div className="space-y-2">
          <label className="text-xs font-medium">Term</label>
          <Select
            value={filters.term ?? "all"}
            onValueChange={(value) =>
              onChange({
                ...filters,
                term: value === "all" ? undefined : (value as AcademicTerm),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              {TERM_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-xs font-medium">Status</label>
          <Select
            value={filters.statuses?.[0] ?? "all"}
            onValueChange={(value) =>
              onChange({
                ...filters,
                statuses:
                  value === "all" || !value ? undefined : ([value].filter(Boolean) as string[]),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Course Selection */}
      {availableCourses.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium">Courses</label>
          <div className="flex flex-wrap gap-2">
            {availableCourses.map((course) => {
              const isSelected = filters.courseIds?.includes(course.id) ?? false;
              return (
                <Badge
                  key={course.id}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    const newCourseIds = isSelected
                      ? (filters.courseIds || []).filter((id) => id !== course.id)
                      : [...(filters.courseIds || []), course.id];
                    onChange({ ...filters, courseIds: newCourseIds });
                  }}
                >
                  {course.label}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear Button */}
      {hasFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
