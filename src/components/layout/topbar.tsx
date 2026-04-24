"use client";

import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileSidebarDrawer } from "./mobile-sidebar-drawer";
import type { Role } from "@/lib/constants/roles";
import type { MobileNavMode } from "@/lib/constants/navigation";

interface TopbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  mobileNavMode?: MobileNavMode;
  roles?: Role[];
}

export function Topbar({ user, mobileNavMode = "bottom-nav", roles }: TopbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "GET" });
    router.push("/login");
    router.refresh();
  };

  const initials = user?.name?.[0]?.toUpperCase() || "U";
  const showHamburger = mobileNavMode === "hamburger";

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      {/* Left side: branding (mobile) or hamburger trigger */}
      <div className="flex items-center gap-3 lg:hidden">
        {showHamburger ? (
          <MobileSidebarDrawer roles={roles} user={user} />
        ) : (
          <>
            <Image
              src="/logos/cloie-logo.png"
              alt="CLOIE Logo"
              width={28}
              height={28}
              className="rounded"
            />
            <span className="text-title-md font-bold tracking-tight text-primary">
              CLOIE
            </span>
          </>
        )}
      </div>

      <div className="hidden lg:flex" /> {/* Empty spacer for desktop */}

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
        >
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-surface" />
        </button>

        {/* Profile avatar + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-muted focus:outline-none">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <span className="text-caption font-semibold">{initials}</span>
            </div>
            <ChevronDown className="size-4 text-text-muted" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-56">
            <div className="px-3 py-2">
              <p className="text-label-md font-semibold text-text-primary">
                {user?.name || "User"}
              </p>
              <p className="text-caption text-text-muted">
                {user?.email || "No email"}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-danger focus:text-danger"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
