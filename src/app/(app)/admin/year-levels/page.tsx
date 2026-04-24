import { YearLevelManagement } from "@/features/academic-structure/components/year-level-management";
import { listYearLevels } from "@/features/academic-structure/services/manage-year-levels";

export default async function AdminYearLevelsPage() {
  const yearLevels = await listYearLevels();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Year Levels</h1>
        <p className="text-sm text-text-secondary">
          Student context and targeting now rely on program, optional major, and year
          level only.
        </p>
      </div>

      <YearLevelManagement yearLevels={yearLevels} />
    </div>
  );
}
