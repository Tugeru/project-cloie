import Link from "next/link";
import Image from "next/image";
import { 
  LayoutDashboard, 
  BookOpen, 
  FileCheck, 
  Users, 
  BarChart, 
  Settings 
} from "lucide-react";
import type { Role } from "@/lib/constants/roles";

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  roles?: Role[];
}

/**
 * Temporary mock navigation data.
 * Will be driven by role-based auth in Task 6.
 */
const MOCK_NAV = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Curriculum", href: "/curriculum", icon: BookOpen },
  { name: "Evaluations", href: "/evaluations", icon: FileCheck },
  { name: "Users", href: "/users", icon: Users },
  { name: "Reports", href: "/reports", icon: BarChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ user }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image 
            src="/logos/cloie-logo.png" 
            alt="CLOIE Logo" 
            width={32} 
            height={32} 
            className="rounded"
          />
          <span className="text-title-lg font-bold text-primary tracking-tight">CLOIE</span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto px-4 py-6 space-y-1">
        {MOCK_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-body-md font-medium text-text-secondary transition-colors hover:bg-primary-soft hover:text-primary-hover active:bg-primary-muted"
          >
            <item.icon className="size-5 shrink-0" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <span className="text-body-sm font-semibold">
              {user?.name?.[0] || "U"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-label-md font-semibold text-text-primary">
              {user?.name || "User"}
            </span>
            <span className="text-caption text-text-muted">
              {user?.email || "No email provided"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
