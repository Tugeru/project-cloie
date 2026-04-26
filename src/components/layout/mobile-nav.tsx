"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/constants/roles";
import { getMobileNavByRoles } from "@/lib/constants/navigation";

interface MobileNavProps {
  roles?: Role[];
}

export function MobileNav({ roles = [] }: MobileNavProps) {
  const pathname = usePathname();

  const mainNav = getMobileNavByRoles(roles);

  return (
    <nav className="border-border bg-surface pb-safe fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-between border-t px-4 lg:hidden">
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
            <span
              className={cn(
                "text-[10px] leading-none font-medium",
                isActive ? "text-primary" : "text-text-muted"
              )}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
