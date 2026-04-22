import { SystemRole } from "@prisma/client";

export const DEMO_USERS = [
  { email: "demo-admin@cloie.test", label: "Admin", role: SystemRole.ADMIN },
  { email: "demo-dean@cloie.test", label: "Dean", role: SystemRole.DEAN },
  { email: "demo-ph@cloie.test", label: "Program Head", role: SystemRole.PROGRAM_HEAD },
  { email: "demo-faculty@cloie.test", label: "Faculty", role: SystemRole.FACULTY },
  { email: "demo-student@cloie.test", label: "Student", role: SystemRole.STUDENT },
  { email: "demo-grad@cloie.test", label: "Graduating Student", role: SystemRole.STUDENT },
  { email: "demo-alumni@cloie.test", label: "Alumni", role: SystemRole.ALUMNI },
  { email: "demo-industry@cloie.test", label: "Industry Partner", role: SystemRole.INDUSTRY_PARTNER },
] as const;

export const DEMO_USER_EMAILS = DEMO_USERS.map((user) => user.email);
