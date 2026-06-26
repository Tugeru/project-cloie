import type { YearLevel, StudentSection } from "@prisma/client";

/**
 * Course assignment record with related data.
 */
export type CourseAssignmentItem = {
  id: string;
  termInstanceId: string;
  facultyId: string;
  courseId: string;
  programId: string;
  yearLevel: YearLevel;
  section: StudentSection;
  assignedBy: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Hydrated fields
  facultyName?: string;
  facultyEmail?: string;
  courseCode?: string;
  courseTitle?: string;
  programCode?: string;
  programName?: string;
  termLabel?: string;
  lastTermTaught?: string;
};

/**
 * Input for creating a course assignment.
 */
export type CreateCourseAssignmentInput = {
  termInstanceId: string;
  facultyId: string;
  courseId: string;
  programId: string;
  yearLevel: YearLevel;
  section: StudentSection;
};

/**
 * Input for updating a course assignment.
 */
export type UpdateCourseAssignmentInput = {
  assignmentId: string;
  programId?: string;
  yearLevel?: YearLevel;
  section?: StudentSection;
};

/**
 * Input for deactivating a course assignment.
 */
export type DeactivateCourseAssignmentInput = {
  assignmentId: string;
};

/**
 * Input for activating a course assignment.
 */
export type ActivateCourseAssignmentInput = {
  assignmentId: string;
};

/**
 * Input for deleting a course assignment (hard delete).
 */
export type DeleteCourseAssignmentInput = {
  assignmentId: string;
};

/**
 * Input for bulk creating course assignments.
 */
export type BulkCreateCourseAssignmentsInput = {
  assignments: CreateCourseAssignmentInput[];
};

/**
 * Result of a course assignment operation.
 */
export type CourseAssignmentResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Filter options for listing course assignments.
 */
export type ListCourseAssignmentsFilter = {
  termInstanceId?: string;
  courseId?: string;
  facultyId?: string;
  programId?: string;
  yearLevel?: YearLevel;
  section?: StudentSection;
  isActive?: boolean;
};

/**
 * Pagination options.
 */
export type ListOptions = {
  page?: number;
  pageSize?: number;
};

/**
 * Result of listing course assignments.
 */
export type ListCourseAssignmentsResult = {
  items: CourseAssignmentItem[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Faculty search result item.
 */
export type FacultySearchResult = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  primaryAffiliation?: string;
  primaryAffiliationCode?: string;
  affiliations: string[];
};

/**
 * Bulk creation result.
 */
export type BulkCreateResult = {
  success: boolean;
  created: number;
  errors: Array<{ index: number; error: string }>;
};
