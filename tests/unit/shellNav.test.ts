/**
 * App shell navigation rules (UI redesign Phase 2):
 *  - ≤ 7 rail items per role (Hick's law)
 *  - every existing dashboard page is reachable in ≤ 2 clicks (rail → panel) for a role allowed to open it
 *  - the role guard (G11) and the rail agree with each other
 */
import {
  NAV,
  HOME,
  activeRailItem,
  activePanelItem,
  isAllowed,
  withUid,
  type Role,
} from "@/components/shell/nav-config";
import { academicYearOptions, getCurrentAcademicYear } from "@/lib/academic-year";

const D = "/u/portal/dashboard";
// Every page.tsx under src/app/u/portal/dashboard (dynamic segments excluded), and who may open it.
const PAGES: Record<string, Role[]> = {
  [D]: ["faculty"],
  [`${D}/profile`]: ["faculty"],
  [`${D}/good-works`]: ["faculty"],
  [`${D}/good-works/submit`]: ["faculty"],
  [`${D}/remarks`]: ["faculty"],
  [`${D}/appeals`]: ["faculty"],
  [`${D}/notifications`]: ["faculty", "oa", "admin"],
  [`${D}/account/profile`]: ["faculty", "oa", "admin"],
  [`${D}/account/password`]: ["faculty", "oa", "admin"],
  [`${D}/account/preferences`]: ["faculty", "oa", "admin"],
  [`${D}/account/security`]: ["faculty", "oa", "admin"],
  [`${D}/oa`]: ["oa"],
  [`${D}/oa/positive`]: ["oa"],
  [`${D}/oa/history`]: ["oa"],
  [`${D}/admin`]: ["admin"],
  [`${D}/admin/review`]: ["admin"],
  [`${D}/admin/appeals`]: ["admin"],
  [`${D}/admin/positive-remarks`]: ["admin"],
  [`${D}/admin/remarks`]: ["admin"],
  [`${D}/admin/faculty-ledger`]: ["admin"],
  [`${D}/admin/credits`]: ["admin"],
  [`${D}/admin/policies`]: ["admin"],
  [`${D}/admin/users`]: ["admin", "oa"],
  [`${D}/admin/users/bulk-add`]: ["admin"],
  [`${D}/admin/reports`]: ["admin"],
  [`${D}/admin/setup/organization`]: ["admin"],
  [`${D}/admin/setup/academic-years`]: ["admin"],
  [`${D}/admin/setup/administration`]: ["admin"],
  [`${D}/admin/setup/history`]: ["admin"],
};
const ROLES: Role[] = ["faculty", "oa", "admin"];

describe("primary rail", () => {
  test.each(ROLES)("%s has at most 7 rail items", (role) => {
    expect(NAV[role].length).toBeLessThanOrEqual(7);
  });

  test.each(ROLES)("%s rail only links to pages the role may open", (role) => {
    for (const item of NAV[role]) {
      expect(isAllowed(role, item.path)).toBe(true);
      for (const p of item.groups.flatMap((g) => g.items)) expect(isAllowed(role, p.path)).toBe(true);
    }
  });
});

describe("every page reachable in ≤ 2 clicks and highlighted correctly", () => {
  for (const [page, roles] of Object.entries(PAGES)) {
    for (const role of roles) {
      test(`${role}: ${page.replace(D, "") || "/"}`, () => {
        const rail = activeRailItem(role, page);
        expect(rail).toBeDefined();
        const inPanel = rail!.groups.flatMap((g) => g.items).some((i) => i.path === page);
        expect(rail!.path === page || inPanel).toBe(true);
        expect(activePanelItem(rail, page)?.path ?? rail!.path).toBe(page);
      });
    }
  }
});

describe("role guard (G11)", () => {
  test.each(Object.entries(PAGES))("%s", (page, roles) => {
    for (const role of ROLES) expect(isAllowed(role, page)).toBe(roles.includes(role));
  });

  test.each(ROLES)("%s home is allowed", (role) => expect(isAllowed(role, HOME[role])).toBe(true));

  test("pages outside the dashboard are not guarded", () => {
    expect(isAllowed("faculty", "/u/portal/help")).toBe(true);
  });
});

describe("helpers", () => {
  test("withUid adds the uid once, but not to Help", () => {
    expect(withUid(`${D}/good-works`, "u1")).toBe(`${D}/good-works?uid=u1`);
    expect(withUid(`${D}/x?a=1`, "u1")).toBe(`${D}/x?a=1&uid=u1`);
    expect(withUid("/u/portal/help", "u1")).toBe("/u/portal/help");
  });

  test("academic year starts in June and lists 5 years newest first", () => {
    expect(getCurrentAcademicYear(new Date(2026, 4, 31))).toBe("2025-26");
    expect(getCurrentAcademicYear(new Date(2026, 5, 1))).toBe("2026-27");
    expect(academicYearOptions(5, new Date(2026, 9, 5))).toEqual([
      "2026-27",
      "2025-26",
      "2024-25",
      "2023-24",
      "2022-23",
    ]);
  });
});
