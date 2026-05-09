import { ROLES } from "@/lib/constants/roles";
import type { ResolvedAuthSession } from "@/features/auth/services/resolve-auth-session";

/**
 * Check if user can manage course assignments.
 * Program Heads can manage courses in their program scope or General Education.
 * Admins and Deans can manage any course.
 * Faculty cannot manage assignments (they are assigned by PH/Admin).
 */
export function canManageCourseAssignment(
  session: ResolvedAuthSession | null,
  courseProgramId: string | null,
  phProgramScope: string[] = []
): { allowed: true } | { allowed: false; reason: string } {
  if (!session) {
    return { allowed: false, reason: "Authentication required." };
  }

  // Admin and Dean can manage any course
  if (session.roles.includes(ROLES.ADMIN) || session.roles.includes(ROLES.DEAN)) {
    return { allowed: true };
  }

  // Program Head can manage courses in their scope
  if (session.roles.includes(ROLES.PROGRAM_HEAD)) {
    // GE courses (null program_id) are allowed for all PH
    if (courseProgramId === null) {
      return { allowed: true };
    }
    
    // Check if course program is in PH scope
    if (phProgramScope.includes(courseProgramId)) {
      return { allowed: true };
    }

    return { allowed: false, reason: "Course is outside your program scope." };
  }

  return { allowed: false, reason: "Insufficient permissions." };
}

/**
 * Check if faculty can be assigned to a course.
 * Faculty can be from any program (cross-program assignments allowed).
 */
export function canAssignFaculty(
  facultyId: string,
  _targetProgramId: string
): { allowed: true } | { allowed: false; reason: string } {
  // Cross-program faculty assignments are allowed
  // The faculty's primary affiliation is just a hint
  return { allowed: true };
}

/**
 * Check if user can view course assignments.
 */
export function canViewCourseAssignments(
  session: ResolvedAuthSession | null
): { allowed: true } | { allowed: false; reason: string } {
  if (!session) {
    return { allowed: false, reason: "Authentication required." };
  }

  const allowedRoles = [
    ROLES.ADMIN,
    ROLES.DEAN,
    ROLES.PROGRAM_HEAD,
    ROLES.FACULTY,
  ];

  if (session.roles.some((r) => allowedRoles.includes(r))) {
    return { allowed: true };
  }

  return { allowed: false, reason: "Insufficient permissions." };
}
