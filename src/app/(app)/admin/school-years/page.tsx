import { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import { listSchoolYears } from "@/features/academic-calendar/services/list-school-years";
import { SchoolYearsClientPage } from "./client-page";

export const metadata: Metadata = {
  title: "School Years | Admin",
  description: "Manage school years and academic terms",
};

export default async function SchoolYearsPage() {
  const session = await resolveAuthSession();

  if (!session || !session.roles.includes(ROLES.ADMIN)) {
    redirect("/dashboard");
  }

  const schoolYears = await listSchoolYears({ includeArchived: false });

  return <SchoolYearsClientPage initialData={schoolYears.items} />;
}
