import { describe, expect, it } from "vitest";
import {
  getSnapshotSectionItems,
  isSnapshotSection,
} from "@/features/analytics/services/snapshot-structure";

describe("snapshot-structure helpers", () => {
  it("accepts only valid snapshot section objects", () => {
    expect(isSnapshotSection({ key: "teaching", title: "Teaching" })).toBe(true);
    expect(isSnapshotSection({ key: "teaching" })).toBe(false);
    expect(isSnapshotSection(null)).toBe(false);
  });

  it("normalizes legacy quantitative and qualitative arrays", () => {
    const items = getSnapshotSectionItems({
      key: "teaching",
      qualitative_prompts: [{ key: "remarks", prompt: "Remarks" }],
      quantitative_items: [{ key: "clarity", prompt: "Clarity" }],
      title: "Teaching",
    });

    expect(items).toEqual([
      { key: "clarity", kind: "quantitative", prompt: "Clarity" },
      { key: "remarks", kind: "qualitative", prompt: "Remarks" },
    ]);
  });
});
