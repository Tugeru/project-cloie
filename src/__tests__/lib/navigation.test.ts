import { describe, expect, it } from "vitest";

import {
  getMainNavByRoles,
  getMobileNavByRoles,
} from "@/lib/constants/navigation";
import { ROLES } from "@/lib/constants/roles";

describe("navigation helpers", () => {
  it("orders faculty navigation without the CILO evaluations index page", () => {
    expect(getMainNavByRoles([ROLES.FACULTY]).map((item) => item.name)).toEqual([
      "Dashboard",
      "Manage CILOs",
      "Tools",
      "Publish New",
      "Profile",
    ]);
    expect(getMainNavByRoles([ROLES.FACULTY]).map((item) => item.href)).not.toContain(
      "/faculty/cilo-evaluations",
    );
  });

  it("includes reviewer review areas for program heads and deans", () => {
    expect(getMainNavByRoles([ROLES.PROGRAM_HEAD]).map((item) => item.href)).toContain(
      "/program-head/cilo-reviews",
    );
    expect(getMainNavByRoles([ROLES.DEAN]).map((item) => item.href)).toContain(
      "/dean/cilo-reviews",
    );
    expect(getMobileNavByRoles([ROLES.PROGRAM_HEAD]).map((item) => item.href)).toContain(
      "/program-head/cilo-reviews",
    );
    expect(getMobileNavByRoles([ROLES.DEAN]).map((item) => item.href)).toContain(
      "/dean/cilo-reviews",
    );
  });

  it("prefers dean and program-head navigation over faculty navigation for multi-role reviewers", () => {
    expect(getMainNavByRoles([ROLES.FACULTY, ROLES.PROGRAM_HEAD]).map((item) => item.href)).toContain(
      "/program-head/cilo-reviews",
    );
    expect(getMainNavByRoles([ROLES.FACULTY, ROLES.PROGRAM_HEAD]).map((item) => item.href)).not.toContain(
      "/faculty/cilo-evaluations",
    );
    expect(getMobileNavByRoles([ROLES.FACULTY, ROLES.DEAN]).map((item) => item.href)).toContain(
      "/dean/cilo-reviews",
    );
    expect(getMobileNavByRoles([ROLES.FACULTY, ROLES.DEAN]).map((item) => item.href)).not.toContain(
      "/faculty/cilo-evaluations",
    );
  });
});
