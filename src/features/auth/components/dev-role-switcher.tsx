"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { DEMO_USERS } from "@/lib/constants/demo-users";
import { cn } from "@/lib/utils";

type DevRoleSwitcherProps = {
  activeEmail?: string | null;
};

export function DevRoleSwitcher({ activeEmail }: DevRoleSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-[60] hidden w-72 rounded-2xl border border-border bg-surface/95 p-3 shadow-xl backdrop-blur lg:block">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Dev Roles</p>
          <p className="text-sm text-text-secondary">Instant sign-in for seeded demo accounts</p>
        </div>
        {isPending && <span className="text-xs text-text-muted">Switching...</span>}
      </div>

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
  );
}
