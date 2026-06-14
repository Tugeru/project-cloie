import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { listStudentsForClass } from "@/features/enrollments/services/list-students-for-class";
import type {
  PreviewCourseBoundRespondentsInput,
  PreviewCourseBoundRespondentsResult,
  PreviewRespondent,
} from "../types";

/**
 * Phase 9: Preview respondents using course assignment ID.
 * Resolves class identity from assignment and queries enrollments.
 */
export async function previewCourseBoundRespondents({
  assignmentId,
}: PreviewCourseBoundRespondentsInput): Promise<PreviewCourseBoundRespondentsResult> {
  const authSession = await resolveAuthSession();

  if (!authSession?.roles?.includes(ROLES.FACULTY)) {
    return {
      error: "Faculty authentication is required.",
      success: false,
    };
  }

  try {
    // Lookup the assignment and verify faculty ownership
    const assignment = await prisma.courseAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        term_instance: {
          include: {
            school_year: true,
          },
        },
        program: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    });

    if (!assignment) {
      return {
        error: "Course assignment not found.",
        success: false,
      };
    }

    if (assignment.faculty_id !== authSession.userId) {
      return {
        error: "You do not have access to this course assignment.",
        success: false,
      };
    }

    if (!assignment.is_active) {
      return {
        error: "This course assignment is inactive.",
        success: false,
      };
    }

    // Use listStudentsForClass to get respondents from enrollment ledger
    const studentsResult = await listStudentsForClass({
      termInstanceId: assignment.term_instance_id,
      programId: assignment.program_id,
      yearLevel: assignment.year_level,
      section: assignment.section,
    });

    if (!studentsResult.success) {
      return {
        error: studentsResult.error,
        success: false,
      };
    }

    // Transform StudentRecord[] to PreviewRespondent[]
    const mappedRespondents: PreviewRespondent[] = studentsResult.data.map((student) => ({
      email: student.email,
      firstName: student.firstName,
      lastName: student.lastName,
      majorId: student.majorId,
      majorName: student.majorName,
      programCode: assignment.program.code,
      programId: assignment.program.id,
      programName: assignment.program.name,
      section: assignment.section,
      studentId: student.studentIdNumber,
      userId: student.userId,
      yearLevel: assignment.year_level,
    }));

    return {
      success: true,
      data: mappedRespondents,
    };
  } catch (error) {
    console.error("Failed to preview respondents (V2):", error);
    return {
      error: "Failed to load respondent preview. Please try again.",
      success: false,
    };
  }
}
