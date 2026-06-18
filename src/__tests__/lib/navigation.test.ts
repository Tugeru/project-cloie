import { describe, expect, it } from "vitest";

import { getMainNavByRoles, getMobileNavByRoles } from "@/lib/constants/navigation";
import { ROLES } from "@/lib/constants/roles";

describe("navigation helpers", () => {
  it("secretary navigation hrefs start with /secretary/", () => {
    const secretaryNav = getMainNavByRoles([ROLES.SECRETARY]);
    secretaryNav.forEach((item) => {
      expect(item.href).toMatch(/^\/secretary\//);
    });
  });

  it("orders faculty navigation correctly", () => {
    expect(getMainNavByRoles([ROLES.FACULTY]).map((item) => item.name)).toEqual([
      "Dashboard",
      "Manage CILOs",
      "Tools",
      "Profile",
    ]);
    expect(getMainNavByRoles([ROLES.FACULTY]).map((item) => item.href)).not.toContain(
      "/faculty/analytics"
    );
  });

  it("does not include cilo-reviews in program head and dean nav", () => {
    expect(getMainNavByRoles([ROLES.PROGRAM_HEAD]).map((item) => item.href)).not.toContain(
      "/program-head/cilo-reviews"
    );
    expect(getMainNavByRoles([ROLES.DEAN]).map((item) => item.href)).not.toContain(
      "/dean/cilo-reviews"
    );
    expect(getMobileNavByRoles([ROLES.PROGRAM_HEAD]).map((item) => item.href)).not.toContain(
      "/program-head/cilo-reviews"
    );
    expect(getMobileNavByRoles([ROLES.DEAN]).map((item) => item.href)).not.toContain(
      "/dean/cilo-reviews"
    );
  });

  it("prefers dean and program-head navigation over faculty navigation for multi-role reviewers", () => {
    expect(
      getMainNavByRoles([ROLES.FACULTY, ROLES.PROGRAM_HEAD]).map((item) => item.href)
    ).not.toContain("/faculty/cilo-evaluations");
    expect(getMobileNavByRoles([ROLES.FACULTY, ROLES.DEAN]).map((item) => item.href)).not.toContain(
      "/faculty/cilo-evaluations"
    );
  });
});
