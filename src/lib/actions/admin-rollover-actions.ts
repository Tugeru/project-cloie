"use server";

import {
  runTermRollover,
  previewTermRollover,
} from "@/features/academic-calendar/services/run-term-rollover";
import type { RunTermRolloverInput } from "@/features/academic-calendar/services/run-term-rollover";

// ─── Preview Action ─────────────────────────────────────────────────────────

export async function previewTermRolloverAction(input: RunTermRolloverInput) {
  return await previewTermRollover(input);
}

// ─── Run Action ─────────────────────────────────────────────────────────────

export async function runTermRolloverAction(input: RunTermRolloverInput) {
  return await runTermRollover(input);
}
