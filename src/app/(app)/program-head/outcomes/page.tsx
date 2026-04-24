import { redirect } from "next/navigation";
import { listProgramGOs } from "@/features/outcomes/services/manage-program-head-outcomes";
import { ProgramHeadOutcomesPage } from "@/features/outcomes/components/program-head-outcomes-page";

export const metadata = {
  title: "Graduate Outcomes — Program Head | CLOIE",
};

export default async function OutcomesPage() {
  const result = await listProgramGOs();

  if (!result.success) {
    redirect("/unauthorized");
  }

  return (
    <ProgramHeadOutcomesPage
      gos={result.data.gos}
      program={result.data.program}
    />
  );
}
