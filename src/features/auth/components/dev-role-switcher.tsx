"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DEMO_USERS } from "@/lib/constants/demo-users";
import { cn } from "@/lib/utils";

type DevRoleSwitcherProps = {
  activeEmail?: string | null;
};

export function DevRoleSwitcher({ activeEmail }: DevRoleSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(true);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  useEffect(() => {
    const storedValue = window.localStorage.getItem("cloie-dev-role-switcher-expanded");

    if (storedValue === "false") {
      setIsExpanded(false);
    }
  }, []);

  const toggleExpanded = () => {
    setIsExpanded((previous) => {
      const nextValue = !previous;

      window.localStorage.setItem("cloie-dev-role-switcher-expanded", String(nextValue));

      return nextValue;
    });
  };

  return (
    <div className="fixed bottom-20 right-4 z-[60] hidden w-72 rounded-2xl border border-border bg-surface/95 p-3 shadow-xl backdrop-blur lg:block">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls="dev-role-switcher-panel"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Dev Roles</p>
          <p className="text-sm text-text-secondary">
            {isExpanded ? "Instant sign-in for seeded demo accounts" : "Click to expand instant sign-in options"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPending && <span className="text-xs text-text-muted">Switching...</span>}
          <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
            {isExpanded ? "Hide" : "Show"}
          </span>
        </div>
      </button>

      <div
        id="dev-role-switcher-panel"
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows,margin-top,opacity] duration-200 ease-out",
          isExpanded ? "mt-3 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0">
          <div className="grid gap-2">
            {DEMO_USERS.map((user) => {
              const isActive = user.email === activeEmail;

              return (
                <button
                  key={user.email}
                  type="button"
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left transition-colors",
                    isActive
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border bg-background hover:border-primary/40 hover:bg-primary-soft/40",
                  )}
                  onClick={() =>
                    startTransition(async () => {
                      await fetch("/api/auth/dev-login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: user.email }),
                      });
                      router.push("/dashboard");
                      router.refresh();
                    })
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{user.label}</p>
                      <p className="text-xs text-text-muted">{user.email}</p>
                    </div>
                    <span className="rounded-full bg-surface-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                      {user.role.replaceAll("_", " ")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
