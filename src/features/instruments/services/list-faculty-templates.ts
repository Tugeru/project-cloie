import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FacultyTemplateItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_faculty_accessible: boolean;
  programCode: string | null;
  programName: string | null;
  structure: unknown;
  versionCount: number;
};

export type ListFacultyTemplatesResult =
  | {
      success: true;
      templates: FacultyTemplateItem[];
      program: { id: string; code: string; name: string };
    }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export async function listFacultyTemplates(): Promise<ListFacultyTemplatesResult> {
  const session = await resolveAuthSession();

  if (!session || !session.roles.includes(ROLES.FACULTY)) {
    return { success: false, error: "Unauthorized. Faculty role required." };
  }

  // Resolve faculty's active program affiliations
  const affiliations = await prisma.facultyProgramAffiliation.findMany({
    where: {
      faculty_id: session.userId,
      is_active: true,
    },
    select: {
      program: { select: { id: true, code: true, name: true } },
    },
  });

  if (affiliations.length === 0) {
    return {
      success: false,
      error: "No active program affiliation found.",
    };
  }

  // Use first affiliation's program
  const program = affiliations[0].program;
  const programIds = affiliations.map((a) => a.program.id);

  // Fetch templates that are faculty-accessible and belong to the faculty's programs
  const rawTemplates = await prisma.instrumentTemplate.findMany({
    where: {
      is_faculty_accessible: true,
      is_active: true,
      OR: [
        { program_id: { in: programIds } },
        { program_id: null }, // institutional baselines with faculty access
      ],
    },
    include: {
      program: { select: { code: true, name: true } },
      _count: { select: { versions: true } },
    },
    orderBy: { updated_at: "desc" },
  });

  const templates: FacultyTemplateItem[] = rawTemplates.map((t) => ({
    id: t.id,
    code: t.code,
    name: t.name,
    description: t.description,
    is_active: t.is_active,
    is_faculty_accessible: t.is_faculty_accessible,
    programCode: t.program?.code ?? null,
    programName: t.program?.name ?? null,
    structure: t.structure,
    versionCount: t._count.versions,
  }));

  return { success: true, templates, program };
}

export async function getFacultyTemplate(templateId: string) {
  const session = await resolveAuthSession();

  if (!session || !session.roles.includes(ROLES.FACULTY)) {
    return null;
  }

  const template = await prisma.instrumentTemplate.findFirst({
    where: {
      id: templateId,
      is_faculty_accessible: true,
      is_active: true,
    },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      is_active: true,
      is_faculty_accessible: true,
      structure: true,
      program: { select: { id: true, code: true, name: true } },
    },
  });

  return template;
}
