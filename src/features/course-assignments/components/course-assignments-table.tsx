"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { showToast } from "@/components/ui/toast";
import { deactivateCourseAssignmentAction } from "@/lib/actions/course-assignment-actions";
import type { CourseAssignmentItem } from "@/features/course-assignments/types";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/constants/page-sizes";
import { getYearLevelDisplay } from "@/lib/constants/academic";

interface CourseAssignmentsTableProps {
  assignments: CourseAssignmentItem[];
  total: number;
  page: number;
  pageSize?: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onAssignmentUpdated?: () => void;
  onEdit?: (assignment: CourseAssignmentItem) => void;
}

export function CourseAssignmentsTable({
  assignments,
  total,
  page,
  pageSize = DEFAULT_TABLE_PAGE_SIZE,
  loading = false,
  onPageChange,
  onAssignmentUpdated,
  onEdit,
}: CourseAssignmentsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  const handleDeactivate = async (assignmentId: string) => {
    setDeletingId(assignmentId);
    const result = await deactivateCourseAssignmentAction({ assignmentId });
    setDeletingId(null);

    if (result.success) {
      showToast("Assignment deactivated successfully.", "success");
      onAssignmentUpdated?.();
    } else {
      showToast(result.error || "Failed to deactivate assignment.", "error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No course assignments found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Faculty</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Year Level</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Term</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  <div className="font-medium">{assignment.courseCode}</div>
                  <div className="text-sm text-muted-foreground">{assignment.courseTitle}</div>
                </TableCell>
                <TableCell>
                  <div>{assignment.facultyName}</div>
                  <div className="text-sm text-muted-foreground">{assignment.facultyEmail}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{assignment.programCode}</Badge>
                </TableCell>
                <TableCell>{getYearLevelDisplay(assignment.yearLevel)}</TableCell>
                <TableCell>{assignment.section ?? "—"}</TableCell>
                <TableCell>{assignment.termLabel}</TableCell>
                <TableCell>
                  <Badge variant={assignment.isActive ? "default" : "secondary"}>
                    {assignment.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(assignment)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeactivate(assignment.id)}
                        disabled={deletingId === assignment.id || !assignment.isActive}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletingId === assignment.id ? "Deactivating..." : "Deactivate"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
