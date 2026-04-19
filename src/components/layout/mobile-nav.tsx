"use client";

import Link from "next/link";
import { 
  LayoutDashboard, 
  BookOpen, 
  FileCheck, 
  Menu 
} from "lucide-react";
import type { Role } from "@/lib/constants/roles";

interface MobileNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  roles?: Role[];
}

/**
 * Temporary mock navigation data for mobile bottom bar.
 * Limit to top 3 actions + a menu drawer trigger.
 */
const MOCK_MOBILE_NAV = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Curriculum", href: "/curriculum", icon: BookOpen },
  { name: "Evaluations", href: "/evaluations", icon: FileCheck },
];

export function MobileNav({ roles }: MobileNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-between border-t border-border bg-surface px-6 pb-safe lg:hidden">
      {MOCK_MOBILE_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-col items-center justify-center gap-1 text-text-muted hover:text-primary active:text-primary-active"
        >
          <item.icon className="size-6" />
          <span className="text-[10px] font-medium leading-none">{item.name}</span>
        </Link>
      ))}
      <button 
        type="button" 
        className="flex flex-col items-center justify-center gap-1 text-text-muted hover:text-primary active:text-primary-active"
        onClick={() => {
          // TODO: Open mobile drawer menu (Task 6 or later)
          console.log("Open drawer");
        }}
      >
        <Menu className="size-6" />
        <span className="text-[10px] font-medium leading-none">Menu</span>
      </button>
    </nav>
  );
}
