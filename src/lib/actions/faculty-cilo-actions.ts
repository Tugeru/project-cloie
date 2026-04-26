"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";

// ---------------------------------------------------------------------------
// Load CILOs for a course
// ---------------------------------------------------------------------------

export async function loadCilosForCourseAction(courseId: string): Promise<{
  success: boolean;
  cilos?: Array<{ id: string; description: string }>;
  error?: string;
}> {
  const session = await resolveAuthSession();

  if (!session || !session.roles.includes(ROLES.FACULTY)) {
    return { success: false, error: "Faculty authentication required." };
  }

  const cilos = await prisma.cILO.findMany({
    where: { course_id: courseId },
    select: { id: true, description: true },
    orderBy: { created_at: "asc" },
  });

  return { success: true, cilos };
}

// ---------------------------------------------------------------------------
// Save CILOs for a course (delete-all-then-recreate pattern)
// ---------------------------------------------------------------------------

export async function saveCilosForCourseAction(
  courseId: string,
  cilos: Array<{ id?: string; description: string }>
): Promise<{ success: boolean; error?: string }> {
  const session = await resolveAuthSession();

  if (!session || !session.roles.includes(ROLES.FACULTY)) {
    return { success: false, error: "Faculty authentication required." };
  }

  // Validate course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true },
  });

  if (!course) {
    return { success: false, error: "Course not found." };
  }

  // Filter out empty descriptions
  const validCilos = cilos.filter((c) => c.description.trim().length > 0);

  try {
    await prisma.$transaction(async (tx) => {
      // Delete all existing CILOs for this course
      await tx.cILO.deleteMany({
        where: { course_id: courseId },
      });

      // Create new CILOs
      if (validCilos.length > 0) {
        await tx.cILO.createMany({
          data: validCilos.map((c) => ({
            course_id: courseId,
            description: c.description.trim(),
            created_by: session.userId,
          })),
        });
      }
    });
  } catch (err) {
    console.error("Failed to save CILOs:", err);
    return { success: false, error: "Failed to save CILOs." };
  }

  revalidatePath("/faculty/cilos");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Add CILOs to a course (batch add from the new page)
// ---------------------------------------------------------------------------

export async function addCilosToCourseAction(
  courseId: string,
  descriptions: string[]
): Promise<{ success: boolean; error?: string }> {
  const session = await resolveAuthSession();

  if (!session || !session.roles.includes(ROLES.FACULTY)) {
    return { success: false, error: "Faculty authentication required." };
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true },
  });

  if (!course) {
    return { success: false, error: "Course not found." };
  }

  const validDescriptions = descriptions.filter((d) => d.trim().length > 0);

  if (validDescriptions.length === 0) {
    return { success: false, error: "At least one CILO is required." };
  }

  try {
    await prisma.cILO.createMany({
      data: validDescriptions.map((desc) => ({
        course_id: courseId,
        description: desc.trim(),
        created_by: session.userId,
      })),
    });
  } catch (err) {
    console.error("Failed to add CILOs:", err);
    return { success: false, error: "Failed to add CILOs." };
  }

  revalidatePath("/faculty/cilos");
  return { success: true };
}
