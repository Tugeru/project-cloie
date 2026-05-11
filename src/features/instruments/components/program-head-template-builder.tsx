"use client";

import { useRouter } from "next/navigation";
import { TemplateBuilder } from "./template-builder";
import { createBaselineCopyAction } from "@/lib/actions/program-head-baseline-actions";
import type { TemplateBuilderProps } from "./template-builder";

interface ProgramHeadTemplateBuilderProps extends Omit<
  TemplateBuilderProps,
  "onSaveResult" | "isInstitutionalBaseline" | "onSaveAsCopy" | "onPublish"
> {
  isInstitutionalBaseline?: boolean;
}

export function ProgramHeadTemplateBuilder({
  isInstitutionalBaseline = false,
  ...props
}: ProgramHeadTemplateBuilderProps) {
  const router = useRouter();
  const templateId = props.initialData?.id;

  const handlePublish = templateId
    ? () => router.push(`/program-head/tools/publish?templateId=${templateId}`)
    : undefined;

  return (
    <TemplateBuilder
      {...props}
      isInstitutionalBaseline={isInstitutionalBaseline}
      onSaveAsCopy={createBaselineCopyAction}
      toolsHref="/program-head/tools"
      onPublish={handlePublish}
    />
  );
}
