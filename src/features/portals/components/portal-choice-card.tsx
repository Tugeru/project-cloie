"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface PortalChoiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  roles: string[];
  href: string;
  badge: string;
}

export function PortalChoiceCard({
  icon,
  title,
  description,
  roles,
  href,
  badge,
}: PortalChoiceCardProps) {
  return (
    <a
      href={href}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md hover:ring-1 hover:ring-primary/10"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
          {icon}
        </div>
        <span className="text-caption rounded-full bg-surface-muted px-3 py-1 font-medium text-text-muted">
          {badge}
        </span>
      </div>

      <h2 className="text-title-md mb-2 font-semibold text-text-primary">{title}</h2>
      <p className="text-body-sm mb-4 flex-1 text-text-secondary">{description}</p>

      <div className="mb-4 flex flex-wrap gap-x-3 gap-y-1">
        {roles.map((role) => (
          <span key={role} className="text-caption text-text-muted">
            {role}
          </span>
        ))}
      </div>

      <Button
        className="w-full gap-2 bg-white text-text-primary shadow-sm transition-colors group-hover:bg-primary group-hover:text-white"
        variant="outline"
      >
        Continue
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Button>
    </a>
  );
}
