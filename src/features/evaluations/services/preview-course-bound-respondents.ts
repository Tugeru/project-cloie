import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { listStudentsForClass } from "@/features/enrollments/services/list-students-for-class";
import type {
  PreviewCourseBoundRespondentsInput,
  PreviewCourseBoundRespondentsInputV2,
  PreviewCourseBoundRespondentsResult,
  PreviewRespondent,
} from "../types";

export async function previewCourseBoundRespondents({
  academicYear,
  section,
  targetPrograms,
  targetYearLevel,
}: PreviewCourseBoundRespondentsInput): Promise<PreviewCourseBoundRespondentsResult> {
  const authSession = await resolveAuthSession();

  if (!authSession?.roles?.includes(ROLES.FACULTY)) {
    return {
      error: "Faculty authentication is required.",
      success: false,
    };
  }

  if (!targetPrograms || targetPrograms.length === 0) {
    return {
      error: "At least one target program must be selected.",
      success: false,
    };
  }

  if (!targetYearLevel) {
    return {
      error: "A year level must be selected.",
      success: false,
    };
  }

  if (!/^\d{4}-\d{4}$/.test(academicYear.trim())) {
    return {
      error: "Academic year must be in YYYY-YYYY format (e.g. 2026-2027).",
      success: false,
    };
  }

  try {
    const respondents = await prisma.studentAcademicProfile.findMany({
      where: {
        academic_year: academicYear,
        program_id: {
          in: targetPrograms,
        },
        year_level: targetYearLevel,
        ...(section ? { section } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        program: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        major: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        user: {
          last_name: "asc",
        },
      },
    });

    const mappedRespondents: PreviewRespondent[] = respondents.map((profile) => ({
      email: profile.user.email,
      firstName: profile.user.first_name,
      lastName: profile.user.last_name,
      majorId: profile.major?.id ?? null,
      majorName: profile.major?.name ?? null,
      programCode: profile.program.code,
      programId: profile.program.id,
      programName: profile.program.name,
      section: profile.section,
      studentId: profile.student_id_number,
      userId: profile.user.id,
      yearLevel: profile.year_level,
    }));

    return {
      respondents: mappedRespondents,
      success: true,
      totalCount: mappedRespondents.length,
    };
  } catch (error) {
    console.error("Failed to preview respondents:", error);
    return {
      error: "Failed to load respondent preview. Please try again.",
      success: false,
    };
  }
}

/**
 * Phase 6: Preview respondents using course assignment ID.
 * Resolves class identity from assignment and queries enrollments.
 */
export async function previewCourseBoundRespondentsV2({
  assignmentId,
}: PreviewCourseBoundRespondentsInputV2): Promise<PreviewCourseBoundRespondentsResult> {
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
      respondents: mappedRespondents,
      success: true,
      totalCount: mappedRespondents.length,
    };
  } catch (error) {
    console.error("Failed to preview respondents (V2):", error);
    return {
      error: "Failed to load respondent preview. Please try again.",
      success: false,
    };
  }
}
