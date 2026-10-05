/**
 * Accessibility (axe, WCAG 2.1 AA rules) and responsive layout checks.
 * Accessibility results are written per page to test-results/a11y/<page>.json.
 */
import fs from "fs";
import AxeBuilder from "@axe-core/playwright";
import { test, expect, resetData, loginFast, USERS, Role } from "./fixtures";

const PAGES: { role: Role | null; path: string; name: string }[] = [
  { role: null, path: "/u/portal/auth?faculty_login", name: "Login" },
  { role: "faculty", path: "/u/portal/dashboard", name: "Faculty dashboard" },
  { role: "faculty", path: "/u/portal/dashboard/good-works", name: "Good works list" },
  { role: "faculty", path: "/u/portal/dashboard/good-works/submit", name: "Submit good work form" },
  { role: "faculty", path: "/u/portal/dashboard/remarks", name: "Negative remarks" },
  { role: "faculty", path: "/u/portal/dashboard/notifications", name: "Notifications" },
  { role: "admin", path: "/u/portal/dashboard/admin", name: "Admin dashboard" },
  { role: "admin", path: "/u/portal/dashboard/admin/users", name: "Admin users" },
  { role: "admin", path: "/u/portal/dashboard/admin/review", name: "Admin review queue" },
  { role: "admin", path: "/u/portal/dashboard/admin/appeals", name: "Admin appeals" },
  { role: "oa", path: "/u/portal/dashboard/oa", name: "OA issue remark form" },
];

test.beforeAll(resetData);

async function open(page: import("@playwright/test").Page, role: Role | null, path: string) {
  if (role) {
    await loginFast(page, role);
    await page.goto(`${path}?uid=${USERS[role].id}`);
  } else {
    await page.goto(path);
  }
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
}

for (const p of PAGES) {
  test(`@a11y ${p.name}: no critical accessibility violations`, async ({ page }, info) => {
    // (A11Y-1 shared header/sidebar fixes applied; remaining issues are page-specific.)
    await open(page, p.role, p.path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const v = results.violations.map((x) => ({
      id: x.id,
      impact: x.impact,
      help: x.help,
      count: x.nodes.length,
      example: x.nodes[0]?.target?.join(" "),
    }));
    fs.mkdirSync("test-results/a11y", { recursive: true });
    fs.writeFileSync(
      `test-results/a11y/${info.project.name}--${p.name.replace(/[^a-zA-Z0-9]+/g, "-")}.json`,
      JSON.stringify({ page: p.name, path: p.path, project: info.project.name, violations: v }, null, 2),
    );
    const critical = v.filter((x) => x.impact === "critical");
    expect.soft(critical, `critical a11y issues on ${p.name}: ${JSON.stringify(critical)}`).toEqual([]);
  });
}

const RESPONSIVE: { role: Role | null; path: string }[] = [
  { role: null, path: "/u/portal/auth?faculty_login" },
  { role: "faculty", path: "/u/portal/dashboard" },
  { role: "faculty", path: "/u/portal/dashboard/good-works" },
  { role: "faculty", path: "/u/portal/dashboard/remarks" },
  { role: "admin", path: "/u/portal/dashboard/admin/users" },
];
for (const r of RESPONSIVE) {
  test(`@mobile no sideways page scroll: ${r.path}`, async ({ page }) => {
    await open(page, r.role, r.path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `page is ${overflow}px wider than the screen`).toBeLessThanOrEqual(1);
  });
}

test("@mobile navigation menu is reachable on a phone", async ({ page }, info) => {
  test.skip(!info.project.name.startsWith("mobile"), "phone-only check");
  await open(page, "faculty", "/u/portal/dashboard");
  // The sidebar is hidden on small screens; some visible control must open navigation.
  const goodWorks = page.getByRole("link", { name: /good works/i }).first();
  if (!(await goodWorks.isVisible())) {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  await expect(page.getByRole("link", { name: /good works/i }).first()).toBeVisible();
});
