import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  actions, 
  className, 
  ...props 
}: PageHeaderProps) {
  return (
    <div 
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8", 
        className
      )} 
      {...props}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-heading-lg text-text-primary">{title}</h1>
        {description && (
          <p className="text-body-md text-text-muted">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
