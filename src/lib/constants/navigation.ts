import { 
  LayoutDashboard, 
  FileText, 
  History, 
  UserCircle,
  HelpCircle,
  Download,
  LogOut,
  ClipboardList,
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

export const STUDENT_SECONDARY_NAV: NavItem[] = [
  { name: "Help", href: "/help", icon: HelpCircle },
  { name: "Install App", href: "#", icon: Download },
  { name: "Logout", href: "/api/auth/logout", icon: LogOut },
];

export const FACULTY_NAV: NavItem[] = [
  { name: "Dashboard", href: "/faculty/dashboard", icon: LayoutDashboard },
  { name: "CILO Evaluations", href: "/faculty/cilo-evaluations", icon: ClipboardList },
  { name: "Publish New", href: "/faculty/cilo-evaluations/new", icon: FileText },
];

export const PROGRAM_HEAD_NAV: NavItem[] = [
  { name: "Dashboard", href: "/program-head/dashboard", icon: LayoutDashboard },
  { name: "CILO Reviews", href: "/program-head/cilo-reviews", icon: ClipboardList },
];

export const DEAN_NAV: NavItem[] = [
  { name: "Dashboard", href: "/dean/dashboard", icon: LayoutDashboard },
  { name: "CILO Reviews", href: "/dean/cilo-reviews", icon: ClipboardList },
];

export const FACULTY_SECONDARY_NAV: NavItem[] = [
  { name: "Help", href: "/help", icon: HelpCircle },
  { name: "Logout", href: "/api/auth/logout", icon: LogOut },
];

export const ACADEMIC_SECONDARY_NAV: NavItem[] = [
  { name: "Help", href: "/help", icon: HelpCircle },
  { name: "Logout", href: "/api/auth/logout", icon: LogOut },
];

export const DEFAULT_NAV: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const ROLE_NAV_PRECEDENCE = [
  ROLES.DEAN,
  ROLES.PROGRAM_HEAD,
  ROLES.FACULTY,
  ROLES.STUDENT,
  ROLES.GRADUATING_STUDENT,
] as const;

function resolveHighestNavRole(roles: Role[]) {
  return ROLE_NAV_PRECEDENCE.find((role) => roles.includes(role)) ?? null;
}

export function getMainNavByRoles(roles: Role[]): NavItem[] {
  const highestRole = resolveHighestNavRole(roles);

  switch (highestRole) {
    case ROLES.DEAN:
      return DEAN_NAV;
    case ROLES.PROGRAM_HEAD:
      return PROGRAM_HEAD_NAV;
    case ROLES.FACULTY:
      return FACULTY_NAV;
    case ROLES.STUDENT:
    case ROLES.GRADUATING_STUDENT:
      return STUDENT_NAV;
    default:
      return DEFAULT_NAV;
  }
}

export function getMobileNavByRoles(roles: Role[]): NavItem[] {
  const highestRole = resolveHighestNavRole(roles);

  switch (highestRole) {
    case ROLES.DEAN:
      return DEAN_NAV;
    case ROLES.PROGRAM_HEAD:
      return PROGRAM_HEAD_NAV;
    case ROLES.FACULTY:
      return FACULTY_NAV;
    case ROLES.STUDENT:
    case ROLES.GRADUATING_STUDENT:
      return STUDENT_MOBILE_NAV;
    default:
      return DEFAULT_NAV;
  }
}

export function getSecondaryNavByRoles(roles: Role[]): NavItem[] {
  const highestRole = resolveHighestNavRole(roles);

  switch (highestRole) {
    case ROLES.DEAN:
    case ROLES.PROGRAM_HEAD:
      return ACADEMIC_SECONDARY_NAV;
    case ROLES.FACULTY:
      return FACULTY_SECONDARY_NAV;
    case ROLES.STUDENT:
    case ROLES.GRADUATING_STUDENT:
      return STUDENT_SECONDARY_NAV;
    default:
      return [];
  }
}
