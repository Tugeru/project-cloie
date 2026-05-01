"use client";

import { TemplateBuilder } from "./template-builder";
import { createBaselineCopyAction } from "@/lib/actions/program-head-baseline-actions";
import type { TemplateBuilderProps } from "./template-builder";

interface ProgramHeadTemplateBuilderProps extends Omit<
  TemplateBuilderProps,
  "onSaveResult" | "isInstitutionalBaseline" | "onSaveAsCopy"
> {
  isInstitutionalBaseline?: boolean;
}

export function ProgramHeadTemplateBuilder({
  isInstitutionalBaseline = false,
  ...props
}: ProgramHeadTemplateBuilderProps) {
  return (
    <TemplateBuilder
      {...props}
      isInstitutionalBaseline={isInstitutionalBaseline}
      onSaveAsCopy={createBaselineCopyAction}
      toolsHref="/program-head/tools"
    />
  );
}
