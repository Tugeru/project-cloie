import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  CreateBaselineTemplateInput,
  UpdateBaselineTemplateInput,
} from "../schemas/template";

type ServiceResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const emptyStructure: Prisma.InputJsonValue = [];

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002",
  );
}

export async function listBaselineTemplates() {
  return prisma.instrumentTemplate.findMany({
    where: {
      program_id: null,
    },
    include: {
      versions: {
        orderBy: {
          version_number: "desc",
        },
        take: 1,
      },
      _count: {
        select: {
          versions: true,
        },
      },
    },
    orderBy: {
      code: "asc",
    },
  });
}

export async function createBaselineTemplate(
  input: CreateBaselineTemplateInput,
): Promise<ServiceResult<{ id: string }>> {
  try {
    const template = await prisma.$transaction(async (tx) => {
      const createdTemplate = await tx.instrumentTemplate.create({
        data: {
          code: input.code,
          name: input.name,
          description: input.description ?? null,
          is_active: true,
          is_faculty_accessible: input.is_faculty_accessible,
          program_id: null,
          structure: emptyStructure,
        },
      });

      await tx.instrumentVersion.create({
        data: {
          template_id: createdTemplate.id,
          version_number: 1,
          structure_snapshot: emptyStructure,
          is_active: true,
        },
      });

      return createdTemplate;
    });

    return { success: true, data: { id: template.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: `A baseline template with code "${input.code}" already exists.`,
      };
    }

    throw error;
  }
}

export async function updateBaselineTemplate(
  input: UpdateBaselineTemplateInput,
): Promise<ServiceResult<{ id: string }>> {
  const template = await prisma.instrumentTemplate.findUnique({
    where: { id: input.id },
    select: { id: true, program_id: true },
  });

  if (!template || template.program_id) {
    return { success: false, error: "Baseline template not found." };
  }

  try {
    const updatedTemplate = await prisma.instrumentTemplate.update({
      where: {
        id: input.id,
      },
      data: {
        code: input.code,
        name: input.name,
        description: input.description ?? null,
        is_faculty_accessible: input.is_faculty_accessible,
      },
    });

    return { success: true, data: { id: updatedTemplate.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: `A baseline template with code "${input.code}" already exists.`,
      };
    }

    throw error;
  }
}

export async function toggleBaselineTemplateActive(
  id: string,
  is_active: boolean,
): Promise<ServiceResult> {
  const template = await prisma.instrumentTemplate.findUnique({
    where: { id },
    select: { id: true, program_id: true },
  });

  if (!template || template.program_id) {
    return { success: false, error: "Baseline template not found." };
  }

  await prisma.instrumentTemplate.update({
    where: {
      id,
    },
    data: {
      is_active,
    },
  });

  return { success: true, data: undefined };
}
