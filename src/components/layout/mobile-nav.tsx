"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu 
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/constants/roles";
import { STUDENT_MOBILE_NAV, DEFAULT_NAV } from "@/lib/constants/navigation";
import { ROLES } from "@/lib/constants/roles";

interface MobileNavProps {
  roles?: Role[];
}

export function MobileNav({ roles = [] }: MobileNavProps) {
  const pathname = usePathname();
  
  const isStudent = roles.includes(ROLES.STUDENT) || roles.includes(ROLES.GRADUATING_STUDENT);
  const mainNav = isStudent ? STUDENT_MOBILE_NAV : DEFAULT_NAV.slice(0, 3);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-between border-t border-border bg-surface px-4 pb-safe lg:hidden">
      {mainNav.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-text-muted hover:text-text-primary"
            )}
          >
            <item.icon className={cn("size-6", isActive && "text-primary")} />
            <span className={cn("text-[10px] font-medium leading-none", isActive ? "text-primary" : "text-text-muted")}>
              {item.name}
            </span>
          </Link>
        );
      })}
      
      {!isStudent && (
        <button 
          type="button" 
          className="flex flex-1 flex-col items-center justify-center gap-1 text-text-muted hover:text-text-primary transition-colors"
          onClick={() => {
            // TODO: Open mobile drawer menu (Task 6 or later)
            console.log("Open drawer");
          }}
        >
          <Menu className="size-6" />
          <span className="text-[10px] font-medium leading-none">Menu</span>
        </button>
      )}
    </nav>
  );
}
