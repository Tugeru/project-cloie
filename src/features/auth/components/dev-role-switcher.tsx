"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import { DEMO_USERS } from "@/lib/constants/demo-users";
import { cn } from "@/lib/utils";

type DevRoleSwitcherProps = {
  activeEmail?: string | null;
};

function useDraggable() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef<{
    pointerX: number;
    pointerY: number;
    elX: number;
    elY: number;
  } | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("cloie-dev-switcher-pos");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { x: number; y: number };
        setPosition(parsed);
      } catch {
        // ignore
      }
    }
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = container.getBoundingClientRect();
    dragStart.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      elX: rect.left,
      elY: rect.top,
    };
    isDragging.current = false;

    // Capture on the handle element itself, not the container
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;

    const dx = e.clientX - dragStart.current.pointerX;
    const dy = e.clientY - dragStart.current.pointerY;

    // Require a minimum movement to start dragging
    if (!isDragging.current && Math.abs(dx) + Math.abs(dy) < 5) return;
    isDragging.current = true;

    const newX = Math.max(0, Math.min(dragStart.current.elX + dx, window.innerWidth - 288));
    const newY = Math.max(0, Math.min(dragStart.current.elY + dy, window.innerHeight - 60));

    setPosition({ x: newX, y: newY });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

    if (isDragging.current && dragStart.current) {
      const dx = e.clientX - dragStart.current.pointerX;
      const dy = e.clientY - dragStart.current.pointerY;
      const newX = Math.max(0, Math.min(dragStart.current.elX + dx, window.innerWidth - 288));
      const newY = Math.max(0, Math.min(dragStart.current.elY + dy, window.innerHeight - 60));
      const pos = { x: newX, y: newY };
      setPosition(pos);
      window.localStorage.setItem("cloie-dev-switcher-pos", JSON.stringify(pos));
    }

    isDragging.current = false;
    dragStart.current = null;
  }, []);

  return {
    containerRef,
    position,
    isDragging,
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
  };
}

export function DevRoleSwitcher({ activeEmail }: DevRoleSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);
  const { containerRef, position, isDragging, dragHandleProps } = useDraggable();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  useEffect(() => {
    const storedValue = window.localStorage.getItem("cloie-dev-role-switcher-expanded");

    if (storedValue === "true") {
      setIsExpanded(true);
    }
  }, []);

  const toggleExpanded = () => {
    if (isDragging.current) return;

    setIsExpanded((previous) => {
      const nextValue = !previous;

      window.localStorage.setItem("cloie-dev-role-switcher-expanded", String(nextValue));

      return nextValue;
    });
  };

  const style: React.CSSProperties = position
    ? { left: position.x, top: position.y, right: "auto", bottom: "auto" }
    : {};

  return (
    <div
      ref={containerRef}
      style={style}
      className={cn(
        "z-[60] hidden w-72 rounded-2xl border border-border bg-surface/95 p-3 shadow-xl backdrop-blur lg:block",
        position ? "fixed" : "fixed bottom-4 right-4",
      )}
    >
      {/* Header — always visible at the top */}
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="flex shrink-0 cursor-grab items-center rounded-md p-1 text-text-muted hover:bg-surface-muted hover:text-text-secondary active:cursor-grabbing"
          title="Drag to reposition"
        >
          <GripVertical className="size-4" />
        </div>

        {/* Header button */}
        <button
          type="button"
          className="flex flex-1 items-start justify-between gap-3 text-left"
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          aria-controls="dev-role-switcher-panel"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
              Dev Roles
            </p>
            <p className="text-xs text-text-secondary">
              {isExpanded
                ? "Instant sign-in for demo accounts"
                : "Click to expand sign-in options"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isPending && <span className="text-xs text-text-muted">...</span>}
            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
              {isExpanded ? "Hide" : "Show"}
            </span>
          </div>
        </button>
      </div>

      {/* Expandable list — opens downward below the header */}
      <div
        id="dev-role-switcher-panel"
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows,margin-top,opacity] duration-200 ease-out",
          isExpanded ? "mt-3 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0">
          <div className="grid max-h-[60vh] gap-1.5 overflow-y-auto pr-1">
            {DEMO_USERS.map((user) => {
              const isActive = user.email === activeEmail;

              return (
                <button
                  key={user.email}
                  type="button"
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-left transition-colors",
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
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{user.label}</p>
                      <p className="truncate text-[10px] text-text-muted">{user.email}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-text-secondary">
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
