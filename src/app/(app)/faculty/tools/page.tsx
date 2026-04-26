import { FacultyToolsPage } from "@/features/instruments/components/faculty-tools-page";
import { listFacultyTemplates } from "@/features/instruments/services/list-faculty-templates";

export default async function FacultyToolsRoute() {
  const result = await listFacultyTemplates();

  if (!result.success) {
    return (
      <div className="space-y-4">
        <h1 className="text-heading-lg">Evaluation Tools</h1>
        <p className="text-body-md text-text-secondary">{result.error}</p>
      </div>
    );
  }

  return <FacultyToolsPage program={result.program} templates={result.templates} />;
}
