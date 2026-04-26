import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import { listFacultyCourseContexts } from "./list-faculty-course-contexts";
import type {
  FacultyManagedCiloContext,
  FacultyManagedCiloLoadResult,
  FacultyManagedCiloSaveInput,
  FacultyManagedCiloSaveResult,
} from "../types";

async function assertFacultyManagedCiloScope(
  context: FacultyManagedCiloContext,
): Promise<{ courseId: string; majorId: string | null; programId: string } | null> {
  const availableContexts = await listFacultyCourseContexts();

  const matchingContext = availableContexts.find(
    (candidate) =>
      candidate.courseId === context.courseId &&
      candidate.programId === context.programId &&
      candidate.majorId === context.majorId,
  );

  if (!matchingContext) {
    return null;
  }

  return {
    courseId: matchingContext.courseId,
    majorId: matchingContext.majorId,
    programId: matchingContext.programId,
  };
}

export async function loadFacultyManagedCilos(
  context: FacultyManagedCiloContext,
): Promise<FacultyManagedCiloLoadResult> {
  const authSession = await resolveAuthSession();

  if (!authSession?.roles.includes(ROLES.FACULTY)) {
    return {
      error: "Faculty authentication is required.",
      success: false,
    };
  }

  const scopedContext = await assertFacultyManagedCiloScope(context);

  if (!scopedContext) {
    return {
      error: "You do not have permission to manage CILOs for this course context.",
      success: false,
    };
  }

  const cilos = await prisma.cILO.findMany({
    where: {
      course_id: scopedContext.courseId,
    },
    orderBy: { created_at: "asc" },
    select: {
      description: true,
      id: true,
    },
  });

  return {
    hasSavedCilos: cilos.length > 0,
    items: cilos,
    success: true,
  };
}

export async function saveFacultyManagedCilos(
  input: FacultyManagedCiloSaveInput,
): Promise<FacultyManagedCiloSaveResult> {
  const authSession = await resolveAuthSession();

  if (!authSession?.roles.includes(ROLES.FACULTY)) {
    return {
      error: "Faculty authentication is required.",
      success: false,
    };
  }

  const scopedContext = await assertFacultyManagedCiloScope(input);

  if (!scopedContext) {
    return {
      error: "You do not have permission to manage CILOs for this course context.",
      success: false,
    };
  }

  const normalizedItems = input.items
    .map((item) => item.description.trim())
    .filter((description) => description.length > 0)
    .map((description) => ({
      course_id: scopedContext.courseId,
      created_by: authSession.userId,
      description,
    }));

  await prisma.$transaction(async (tx) => {
      await tx.cILO.deleteMany({
        where: {
          course_id: scopedContext.courseId,
        },
    });

    if (normalizedItems.length > 0) {
      await tx.cILO.createMany({
        data: normalizedItems,
      });
    }
  });

  const items = await prisma.cILO.findMany({
    where: {
      course_id: scopedContext.courseId,
    },
    orderBy: { created_at: "asc" },
    select: {
      description: true,
      id: true,
    },
  });

  return {
    items,
    success: true,
  };
}
