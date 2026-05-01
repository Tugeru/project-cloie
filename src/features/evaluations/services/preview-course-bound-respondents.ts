import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import type {
  PreviewCourseBoundRespondentsInput,
  PreviewCourseBoundRespondentsResult,
} from "../types";

export async function previewCourseBoundRespondents({
  academicYear,
  section,
  targetPrograms,
  targetYearLevelId,
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

  if (!targetYearLevelId) {
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
        year_level_id: targetYearLevelId,
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
        year_level: {
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

    const mappedRespondents = respondents.map((profile) => ({
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
      yearLevelId: profile.year_level.id,
      yearLevelName: profile.year_level.name,
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
