"use server";

import { createBaselineCopy } from "@/features/instruments/services/create-baseline-copy";
import type { TemplateStructure } from "@/features/instruments/types";

export async function createBaselineCopyAction(
  baselineId: string,
  customName: string,
  structure: TemplateStructure
) {
  return createBaselineCopy({ baselineId, customName, structure });
}
