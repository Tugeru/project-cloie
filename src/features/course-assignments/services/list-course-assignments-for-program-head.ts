import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants/page-sizes";
import { canViewCourseAssignments } from "../policies";
import type {
  ListCourseAssignmentsFilter,
  ListOptions,
  ListCourseAssignmentsResult,
  CourseAssignmentResult,
  CourseAssignmentItem,
} from "../types";

/**
 * List course assignments for Program Head view.
 * Returns hydrated rows with faculty info, course info, and "last term taught" hint.
 */
export async function listCourseAssignmentsForProgramHead(
  filter: ListCourseAssignmentsFilter,
  options?: ListOptions
): Promise<CourseAssignmentResult<ListCourseAssignmentsResult>> {
  const authSession = await resolveAuthSession();

  const permission = canViewCourseAssignments(authSession);
  if (!permission.allowed) {
    return { success: false, error: permission.reason };
  }

  const page = options?.page ?? 0;
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;

  const where = {
    ...(filter.termInstanceId && { term_instance_id: filter.termInstanceId }),
    ...(filter.courseId && { course_id: filter.courseId }),
    ...(filter.facultyId && { faculty_id: filter.facultyId }),
    ...(filter.programId && { program_id: filter.programId }),
    ...(filter.yearLevel && { year_level: filter.yearLevel }),
    ...(filter.section && { section: filter.section }),
    ...(filter.isActive !== undefined && { is_active: filter.isActive }),
  };

  try {
    const [items, total] = await Promise.all([
      prisma.courseAssignment.findMany({
        where,
        include: {
          faculty: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          course: {
            select: {
              code: true,
              title: true,
              course_scope: true,
            },
          },
          program: {
            select: {
              code: true,
              name: true,
            },
          },
          term_instance: {
            include: {
              school_year: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: pageSize,
        skip: page * pageSize,
      }),
      prisma.courseAssignment.count({ where }),
    ]);

    // Get last term taught for each faculty-course combination
    const facultyCourseIds = items.map((a) => ({ facultyId: a.faculty_id, courseId: a.course_id }));
    const lastTaughtMap = new Map<string, string>();

    if (facultyCourseIds.length > 0) {
      const previousAssignments = await prisma.courseAssignment.findMany({
        where: {
          faculty_id: { in: [...new Set(facultyCourseIds.map((x) => x.facultyId))] },
          course_id: { in: [...new Set(facultyCourseIds.map((x) => x.courseId))] },
          is_active: false,
        },
        include: {
          term_instance: {
            include: {
              school_year: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });

      for (const assignment of previousAssignments) {
        const key = `${assignment.faculty_id}-${assignment.course_id}`;
        if (!lastTaughtMap.has(key)) {
          lastTaughtMap.set(key, assignment.term_instance.school_year.code);
        }
      }
    }

    const mappedItems: CourseAssignmentItem[] = items.map((a) => {
      const key = `${a.faculty_id}-${a.course_id}`;
      return {
        id: a.id,
        termInstanceId: a.term_instance_id,
        facultyId: a.faculty_id,
        courseId: a.course_id,
        programId: a.program_id,
        yearLevel: a.year_level,
        section: a.section,
        assignedBy: a.assigned_by,
        isActive: a.is_active,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        facultyName: a.faculty ? `${a.faculty.first_name} ${a.faculty.last_name}` : undefined,
        facultyEmail: a.faculty?.email,
        courseCode: a.course?.code,
        courseTitle: a.course?.title,
        programCode: a.program?.code,
        programName: a.program?.name,
        termLabel: a.term_instance?.school_year?.code,
        lastTermTaught: lastTaughtMap.get(key),
      };
    });

    return {
      success: true,
      data: {
        items: mappedItems,
        total,
        page,
        pageSize,
      },
    };
  } catch (error) {
    return { success: false, error: "Failed to list course assignments." };
  }
}
