import { redirect } from "next/navigation";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import { listProgramHeadTemplates } from "@/features/instruments/services/manage-program-head-templates";
import { listProgramHeadDeployments } from "@/features/evaluations/services/list-program-head-deployments";
import { ProgramHeadToolsPage } from "@/features/instruments/components/program-head-tools-page";

export default async function ProgramHeadToolsRoute() {
  const session = await resolveAuthSession();

  if (!session || !session.roles.includes(ROLES.PROGRAM_HEAD)) {
    redirect("/unauthorized");
  }

  const [templatesResult, deploymentsResult] = await Promise.all([
    listProgramHeadTemplates(),
    listProgramHeadDeployments(),
  ]);

  if (!templatesResult.success) {
    return (
      <div className="py-16 text-center">
        <p className="text-on-surface-variant">{templatesResult.error}</p>
      </div>
    );
  }

  if (!deploymentsResult.success) {
    return (
      <div className="py-16 text-center">
        <p className="text-on-surface-variant">{deploymentsResult.error}</p>
      </div>
    );
  }

  const { templates, program } = templatesResult.data;
  const { deployments } = deploymentsResult.data;

  return (
    <ProgramHeadToolsPage
      templates={JSON.parse(JSON.stringify(templates))}
      deployments={JSON.parse(JSON.stringify(deployments))}
      program={program}
    />
  );
}
