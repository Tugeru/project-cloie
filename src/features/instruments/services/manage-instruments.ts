import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  CreateBaselineTemplateInput,
  UpdateBaselineTemplateInput,
  CreateBaselineTemplateWithStructureInput,
  UpdateBaselineTemplateWithStructureInput,
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

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Get single template for editing
// ---------------------------------------------------------------------------

export async function getBaselineTemplate(id: string) {
  return prisma.instrumentTemplate.findFirst({
    where: { id, program_id: null },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      template_type: true,
      is_active: true,
      is_faculty_accessible: true,
      structure: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Create (legacy — without structure)
// ---------------------------------------------------------------------------

export async function createBaselineTemplate(
  input: CreateBaselineTemplateInput,
): Promise<ServiceResult<{ id: string }>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const template = await tx.instrumentTemplate.create({
        data: {
          code: input.code,
          name: input.name,
          description: input.description ?? null,
          is_faculty_accessible:
            input.template_type === "COURSE_BOUND" && input.is_faculty_accessible,
          program_id: null,
          structure: emptyStructure,
          template_type: input.template_type,
        },
      });

      await tx.instrumentVersion.create({
        data: {
          template_id: template.id,
          version_number: 1,
          structure_snapshot: emptyStructure,
        },
      });

      return template;
    });

    return { success: true, data: { id: result.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: `A template with the code "${input.code}" already exists.`,
      };
    }

    throw error;
  }
}

// ---------------------------------------------------------------------------
// Create with structure (for template builder)
// ---------------------------------------------------------------------------

export async function createBaselineTemplateWithStructure(
  input: CreateBaselineTemplateWithStructureInput,
): Promise<ServiceResult<{ id: string }>> {
  const structureJson = input.structure as unknown as Prisma.InputJsonValue;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const template = await tx.instrumentTemplate.create({
        data: {
          code: input.code,
          name: input.name,
          description: input.description ?? null,
          is_faculty_accessible:
            input.template_type === "COURSE_BOUND" && input.is_faculty_accessible,
          program_id: null,
          structure: structureJson,
          template_type: input.template_type,
        },
      });

      await tx.instrumentVersion.create({
        data: {
          template_id: template.id,
          version_number: 1,
          structure_snapshot: structureJson,
        },
      });

      return template;
    });

    return { success: true, data: { id: result.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: `A template with the code "${input.code}" already exists.`,
      };
    }

    throw error;
  }
}

// ---------------------------------------------------------------------------
// Update (legacy — metadata only)
// ---------------------------------------------------------------------------

export async function updateBaselineTemplate(
  input: UpdateBaselineTemplateInput,
): Promise<ServiceResult> {
  const existing = await prisma.instrumentTemplate.findUnique({
    where: { id: input.id },
    select: { program_id: true },
  });

  if (!existing) {
    return { success: false, error: "Template not found." };
  }

  if (existing.program_id !== null) {
    return {
      success: false,
      error: "Only baseline (institutional) templates can be managed here.",
    };
  }

  try {
    await prisma.instrumentTemplate.update({
      where: { id: input.id },
      data: {
        code: input.code,
        name: input.name,
        description: input.description ?? null,
        is_faculty_accessible:
          input.template_type === "COURSE_BOUND" && input.is_faculty_accessible,
        template_type: input.template_type,
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: `A template with the code "${input.code}" already exists.`,
      };
    }

    throw error;
  }
}

// ---------------------------------------------------------------------------
// Update with structure (for template builder)
// ---------------------------------------------------------------------------

export async function updateBaselineTemplateWithStructure(
  input: UpdateBaselineTemplateWithStructureInput,
): Promise<ServiceResult> {
  const existing = await prisma.instrumentTemplate.findUnique({
    where: { id: input.id },
    select: { program_id: true, _count: { select: { versions: true } } },
  });

  if (!existing) {
    return { success: false, error: "Template not found." };
  }

  if (existing.program_id !== null) {
    return {
      success: false,
      error: "Only baseline (institutional) templates can be managed here.",
    };
  }

  const structureJson = input.structure as unknown as Prisma.InputJsonValue;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.instrumentTemplate.update({
        where: { id: input.id },
        data: {
          code: input.code,
          name: input.name,
          description: input.description ?? null,
          is_faculty_accessible:
            input.template_type === "COURSE_BOUND" && input.is_faculty_accessible,
          structure: structureJson,
          template_type: input.template_type,
        },
      });

      // Create a new version snapshot
      await tx.instrumentVersion.create({
        data: {
          template_id: input.id,
          version_number: existing._count.versions + 1,
          structure_snapshot: structureJson,
        },
      });
    });

    return { success: true, data: undefined };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: `A template with the code "${input.code}" already exists.`,
      };
    }

    throw error;
  }
}

// ---------------------------------------------------------------------------
// Toggle active
// ---------------------------------------------------------------------------

export async function toggleBaselineTemplateActive(
  id: string,
  is_active: boolean,
): Promise<ServiceResult> {
  const existing = await prisma.instrumentTemplate.findUnique({
    where: { id },
    select: { program_id: true },
  });

  if (!existing) {
    return { success: false, error: "Template not found." };
  }

  if (existing.program_id !== null) {
    return {
      success: false,
      error: "Only baseline (institutional) templates can be managed here.",
    };
  }

  await prisma.instrumentTemplate.update({
    where: { id },
    data: { is_active },
  });

  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteBaselineTemplate(
  id: string,
): Promise<ServiceResult> {
  const existing = await prisma.instrumentTemplate.findUnique({
    where: { id },
    select: { program_id: true },
  });

  if (!existing) {
    return { success: false, error: "Template not found." };
  }

  if (existing.program_id !== null) {
    return {
      success: false,
      error: "Only baseline (institutional) templates can be deleted here.",
    };
  }

  await prisma.instrumentTemplate.delete({ where: { id } });

  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Duplicate
// ---------------------------------------------------------------------------

export async function duplicateBaselineTemplate(
  id: string,
): Promise<ServiceResult<{ id: string }>> {
  const original = await prisma.instrumentTemplate.findUnique({
    where: { id },
    select: {
      code: true,
      name: true,
      description: true,
      is_faculty_accessible: true,
      template_type: true,
      structure: true,
    },
  });

  if (!original) {
    return { success: false, error: "Template not found." };
  }

  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const newCode = `${original.code}-COPY-${randomSuffix}`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const template = await tx.instrumentTemplate.create({
        data: {
          code: newCode,
          name: `${original.name} (Copy)`,
          description: original.description,
          is_faculty_accessible:
            original.template_type === "COURSE_BOUND" && original.is_faculty_accessible,
          program_id: null,
          structure: original.structure ?? emptyStructure,
          template_type: original.template_type,
        },
      });

      await tx.instrumentVersion.create({
        data: {
          template_id: template.id,
          version_number: 1,
          structure_snapshot: original.structure ?? emptyStructure,
        },
      });

      return template;
    });

    return { success: true, data: { id: result.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: "Failed to duplicate — generated code conflict. Please try again.",
      };
    }

    throw error;
  }
}
