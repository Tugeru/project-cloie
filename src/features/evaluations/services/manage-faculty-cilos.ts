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
  context: FacultyManagedCiloContext
): Promise<{ courseId: string; majorId: string | null; programId: string } | null> {
  const availableContexts = await listFacultyCourseContexts();

  const matchingContext = availableContexts.find(
    (candidate) =>
      candidate.courseId === context.courseId &&
      candidate.programId === context.programId &&
      candidate.majorId === context.majorId
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
  context: FacultyManagedCiloContext
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
  input: FacultyManagedCiloSaveInput
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
    .map((item) => ({ id: item.id, description: item.description.trim() }))
    .filter((item) => item.description.length > 0);

  const toUpdate = normalizedItems.filter((item) => item.id);
  const toCreate = normalizedItems.filter((item) => !item.id);
  const keepIds = new Set(toUpdate.map((item) => item.id!));

  await prisma.$transaction(async (tx) => {
    // Fetch existing CILOs for this course
    const existingCilos = await tx.cILO.findMany({
      where: { course_id: scopedContext.courseId },
      select: { id: true },
    });

    // Delete CILOs that are absent from the input (removed by user)
    const toDeleteIds = existingCilos
      .filter((c) => !keepIds.has(c.id))
      .map((c) => c.id);

    if (toDeleteIds.length > 0) {
      await tx.cILO.deleteMany({
        where: { id: { in: toDeleteIds } },
      });
    }

    // Update existing CILOs with new descriptions
    for (const item of toUpdate) {
      await tx.cILO.update({
        where: { id: item.id! },
        data: { description: item.description },
      });
    }

    // Create new CILOs
    if (toCreate.length > 0) {
      await tx.cILO.createMany({
        data: toCreate.map((item) => ({
          course_id: scopedContext.courseId,
          created_by: authSession.userId,
          description: item.description,
        })),
      });
    }

    // Update template binding snapshots for updated CILOs (draft templates only)
    for (const item of toUpdate) {
      await tx.instrumentTemplateCiloQuestionBinding.updateMany({
        where: { cilo_id: item.id! },
        data: { cilo_description_snapshot: item.description },
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
