import { prisma } from "@/lib/db/prisma";
import type {
  CreateYearLevelInput,
  UpdateYearLevelInput,
} from "../schemas/year-level";

type ServiceResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002",
  );
}

export async function listYearLevels() {
  return prisma.yearLevel.findMany({
    include: {
      _count: {
        select: {
          student_profiles: true,
          course_bound_targets: true,
          central_deployments: true,
        },
      },
    },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
}

export async function createYearLevel(
  input: CreateYearLevelInput,
): Promise<ServiceResult<{ id: string }>> {
  try {
    const yearLevel = await prisma.yearLevel.create({
      data: {
        name: input.name,
        order: input.order,
      },
    });

    return { success: true, data: { id: yearLevel.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: `A year level named "${input.name}" already exists.`,
      };
    }

    throw error;
  }
}

export async function updateYearLevel(
  input: UpdateYearLevelInput,
): Promise<ServiceResult<{ id: string }>> {
  try {
    const yearLevel = await prisma.yearLevel.update({
      where: { id: input.id },
      data: {
        name: input.name,
        order: input.order,
      },
    });

    return { success: true, data: { id: yearLevel.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: `A year level named "${input.name}" already exists.`,
      };
    }

    throw error;
  }
}

export async function deleteYearLevel(id: string): Promise<ServiceResult> {
  const yearLevel = await prisma.yearLevel.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          student_profiles: true,
          course_bound_targets: true,
          central_deployments: true,
        },
      },
    },
  });

  if (!yearLevel) {
    return { success: false, error: "Year level not found." };
  }

  const dependentCount =
    yearLevel._count.student_profiles +
    yearLevel._count.course_bound_targets +
    yearLevel._count.central_deployments;

  if (dependentCount > 0) {
    return {
      success: false,
      error: `Cannot delete ${yearLevel.name}. It has ${dependentCount} dependent record(s).`,
    };
  }

  await prisma.yearLevel.delete({ where: { id } });

  return { success: true, data: undefined };
}
