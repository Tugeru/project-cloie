import { 
  LayoutDashboard, 
  FileText, 
  History, 
  UserCircle,
  HelpCircle,
  Download,
  LogOut,
  type LucideIcon
} from "lucide-react";
import { ROLES, type Role } from "./roles";

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

// Fallback for other roles until their dashboards are implemented
export const DEFAULT_NAV: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];
