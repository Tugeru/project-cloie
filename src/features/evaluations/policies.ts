import { ROLES } from "@/lib/constants/roles";
import type { SystemRole } from "@prisma/client";
import { CourseScope } from "@prisma/client";
import type { AuthSessionSnapshot } from "@/features/auth/services/build-auth-session-snapshot";

export interface CourseAssignmentContext {
  faculty_id: string;
  program_id: string | null;
  course_scope: CourseScope;
}

/**
 * Check if user can deploy a course-bound evaluation for a given assignment.
 * 
 * Authorization rules:
 * - Faculty: Can only deploy their own assignments (self-deploy)
 * - Program Head: Can deploy on-behalf for assignments in their program scope OR GE courses
 * - Dean/Secretary: Can deploy on-behalf for any assignment
 * 
 * @param session - Auth session with roles
 * @param assignment - Course assignment context (faculty_id, program_id, course_scope)
 * @param phProgramScope - List of program IDs the PH has scope over
 */
export function canDeployCourseBoundEvaluation(
  session: AuthSessionSnapshot | null,
  assignment: CourseAssignmentContext,
  phProgramScope: string[] = []
): { allowed: true } | { allowed: false; reason: string } {
  if (!session) {
    return { allowed: false, reason: "Authentication required." };
  }

  // Secretary and Dean can deploy on-behalf for any assignment
  if (session.roles.includes(ROLES.SECRETARY) || session.roles.includes(ROLES.DEAN)) {
    return { allowed: true };
  }

  // Program Head can deploy on-behalf within their scope
  if (session.roles.includes(ROLES.PROGRAM_HEAD)) {
    // GE courses (null program_id) are accessible to all PHs
    if (assignment.course_scope === CourseScope.GENERAL_EDUCATION) {
      return { allowed: true };
    }
    
    // Program-specific courses: check if in PH's scope
    if (assignment.program_id && phProgramScope.includes(assignment.program_id)) {
      return { allowed: true };
    }

    return { 
      allowed: false, 
      reason: "Course is outside your program scope." 
    };
  }

  // Faculty can only deploy their own assignments (self-deploy)
  if (session.roles.includes(ROLES.FACULTY)) {
    if (assignment.faculty_id === session.userId) {
      return { allowed: true };
    }

    return { 
      allowed: false, 
      reason: "Only the assigned faculty member can deploy this evaluation." 
    };
  }

  return { allowed: false, reason: "Insufficient permissions." };
}
