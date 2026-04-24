import {
  LayoutDashboard,
  FileText,
  History,
  UserCircle,
  ClipboardList,
  Building2,
  BookOpen,
  GraduationCap,
  Layers3,
  BarChart3,
  Users2,
  type LucideIcon
} from "lucide-react";
import { ROLES, type Role } from "@/lib/constants/roles";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badgeCount?: number;
}

export const STUDENT_NAV: NavItem[] = [
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "My Evaluations", href: "/student/evaluations", icon: FileText, badgeCount: 3 },
  { name: "Submission History", href: "/student/history", icon: History },
  { name: "Profile", href: "/student/profile", icon: UserCircle },
];

export const STUDENT_MOBILE_NAV: NavItem[] = [
  { name: "Home", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Evaluations", href: "/student/evaluations", icon: FileText },
  { name: "History", href: "/student/history", icon: History },
  { name: "Profile", href: "/student/profile", icon: UserCircle },
];


export const FACULTY_NAV: NavItem[] = [
  { name: "Dashboard", href: "/faculty/dashboard", icon: LayoutDashboard },
  { name: "CILO Evaluations", href: "/faculty/cilo-evaluations", icon: ClipboardList },
  { name: "Publish New", href: "/faculty/cilo-evaluations/new", icon: FileText },
];

export const ADMIN_NAV: NavItem[] = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users2 },
  { name: "Programs", href: "/admin/programs", icon: Building2 },
  { name: "Courses", href: "/admin/courses", icon: BookOpen },
  { name: "Year Levels", href: "/admin/year-levels", icon: GraduationCap },
  { name: "Outcomes", href: "/admin/outcomes", icon: Layers3 },
  { name: "Instruments", href: "/admin/instruments", icon: ClipboardList },
];

export const PROGRAM_HEAD_NAV: NavItem[] = [
  { name: "Dashboard", href: "/program-head/dashboard", icon: LayoutDashboard },
  { name: "Courses", href: "/program-head/courses", icon: BookOpen },
  { name: "CILO Reviews", href: "/program-head/cilo-reviews", icon: ClipboardList },
  { name: "Outcomes", href: "/program-head/outcomes", icon: Layers3 },
  { name: "Tools", href: "/program-head/tools", icon: FileText },
  { name: "Deployments", href: "/program-head/deployments", icon: GraduationCap },
  { name: "Analytics", href: "/program-head/analytics", icon: BarChart3 },
  { name: "Reports", href: "/program-head/reports", icon: FileText },
];

export const DEAN_NAV: NavItem[] = [
  { name: "Dashboard", href: "/dean/dashboard", icon: LayoutDashboard },
  { name: "CILO Reviews", href: "/dean/cilo-reviews", icon: ClipboardList },
  { name: "Analytics", href: "/dean/analytics", icon: BarChart3 },
  { name: "Reports", href: "/dean/reports", icon: FileText },
];

export const ALUMNI_NAV: NavItem[] = [
  { name: "Dashboard", href: "/alumni/dashboard", icon: LayoutDashboard },
  { name: "Evaluations", href: "/alumni/evaluations", icon: FileText },
];

export const INDUSTRY_PARTNER_NAV: NavItem[] = [
  { name: "Dashboard", href: "/industry-partner/dashboard", icon: LayoutDashboard },
  { name: "Evaluations", href: "/industry-partner/evaluations", icon: FileText },
];


export const DEFAULT_NAV: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const ROLE_NAV_PRECEDENCE = [
  ROLES.ADMIN,
  ROLES.DEAN,
  ROLES.PROGRAM_HEAD,
  ROLES.FACULTY,
  ROLES.INDUSTRY_PARTNER,
  ROLES.ALUMNI,
  ROLES.STUDENT,
] as const;

function resolveHighestNavRole(roles: Role[]) {
  return ROLE_NAV_PRECEDENCE.find((role) => roles.includes(role)) ?? null;
}

export function getMainNavByRoles(roles: Role[]): NavItem[] {
  const highestRole = resolveHighestNavRole(roles);

  switch (highestRole) {
    case ROLES.ADMIN:
      return ADMIN_NAV;
    case ROLES.DEAN:
      return DEAN_NAV;
    case ROLES.PROGRAM_HEAD:
      return PROGRAM_HEAD_NAV;
    case ROLES.FACULTY:
      return FACULTY_NAV;
    case ROLES.STUDENT:
      return STUDENT_NAV;
    case ROLES.ALUMNI:
      return ALUMNI_NAV;
    case ROLES.INDUSTRY_PARTNER:
      return INDUSTRY_PARTNER_NAV;
    default:
      return DEFAULT_NAV;
  }
}

export function getMobileNavByRoles(roles: Role[]): NavItem[] {
  const highestRole = resolveHighestNavRole(roles);

  switch (highestRole) {
    case ROLES.ADMIN:
      return ADMIN_NAV;
    case ROLES.DEAN:
      return DEAN_NAV;
    case ROLES.PROGRAM_HEAD:
      return PROGRAM_HEAD_NAV;
    case ROLES.FACULTY:
      return FACULTY_NAV;
    case ROLES.STUDENT:
      return STUDENT_MOBILE_NAV;
    case ROLES.ALUMNI:
      return ALUMNI_NAV;
    case ROLES.INDUSTRY_PARTNER:
      return INDUSTRY_PARTNER_NAV;
    default:
      return DEFAULT_NAV;
  }
}

export function getSecondaryNavByRoles(_roles: Role[]): NavItem[] {
  return [];
}
