import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureRoleAccess } from "@/features/auth/policies/ensure-role-access";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { PublishCourseBoundEvaluationForm } from "@/features/evaluations/components/publish-course-bound-evaluation-form";
import { getFacultyTemplatePublicationContext } from "@/features/instruments/services/manage-faculty-templates";
import { listFacultyTemplates } from "@/features/instruments/services/list-faculty-templates";
import { publishCourseBoundEvaluationAction } from "@/lib/actions/course-bound-evaluation-actions";
import { ROLES } from "@/lib/constants/roles";
import { SEMESTER_OPTIONS, TERM_OPTIONS } from "@/lib/constants/academic";
import { prisma } from "@/lib/db/prisma";

type SearchParams = {
  academicYear?: string;
  semester?: string;
  templateId?: string;
  term?: string;
};

export default async function NewFacultyCiloEvaluationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await resolveAuthSession();

  if (!session) {
    redirect("/login");
  }

  const redirectPath = ensureRoleAccess({
    primaryRole: session.primaryRole,
    roles: session.roles,
    allowedRoles: [ROLES.FACULTY],
  });

  if (redirectPath) {
    redirect(redirectPath);
  }

  const params = await searchParams;
  const yearLevels = await prisma.yearLevel.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      order: true,
    },
  });

  if (params.templateId) {
    const publicationContext = await getFacultyTemplatePublicationContext(params.templateId);

    if (!publicationContext.success) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Publish CILO Evaluation</h1>
            <p className="text-text-secondary text-sm">{publicationContext.error}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/faculty/tools">Back to Tools</Link>
          </Button>
        </div>
      );
    }

    return (
      <PublishCourseBoundEvaluationForm
        initialSelection={{
          academicYear: params.academicYear,
          semester:
            params.semester === "SECOND" || params.semester === "SUMMER"
              ? params.semester
              : params.semester === "FIRST"
                ? "FIRST"
                : SEMESTER_OPTIONS[0].value,
          term:
            params.term === "SECOND_TERM"
              ? "SECOND_TERM"
              : params.term === "FIRST_TERM"
                ? "FIRST_TERM"
                : TERM_OPTIONS[0].value,
        }}
        publicationContext={publicationContext.data}
        publishAction={publishCourseBoundEvaluationAction}
        yearLevels={yearLevels}
      />
    );
  }

  const templateResult = await listFacultyTemplates();

  if (!templateResult.success) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Publish CILO Evaluation</h1>
        <p className="text-text-secondary text-sm">{templateResult.error}</p>
      </div>
    );
  }

  const ownedTemplates = templateResult.templates.filter(
    (template) => Boolean(template.facultyOwnerId) && template.boundCourseId
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Publish CILO Evaluation</h1>
        <p className="text-text-secondary text-sm">
          Choose a saved faculty template. The course context and CILO bindings must already be
          configured in the template builder before you publish.
        </p>
      </div>

      {ownedTemplates.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-8">
            <p className="text-text-secondary text-sm">
              No saved faculty-owned course-bound templates are ready yet. Create or duplicate a
              template in Tools, bind its CILOs in the builder, then return here to publish.
            </p>
            <Button asChild variant="outline">
              <Link href="/faculty/tools">Go to Tools</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {ownedTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <p className="text-text-secondary text-sm">{template.code}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {template.description && (
                  <p className="text-text-secondary text-sm">{template.description}</p>
                )}
                <div className="flex gap-2">
                  <Button asChild>
                    <Link href={`/faculty/cilo-evaluations/new?templateId=${template.id}`}>
                      Continue to Publish
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/faculty/tools/${template.id}/edit`}>Edit Template</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
