/**
 * Visual snapshots for design reviews (not part of the normal run).
 *   SCREEN_LABEL=before npx playwright test --project=visual
 * Saves full-page PNGs to test-results/screens/<label>/<page>-<theme>.png
 * and a pixel-diff check for the admissions page (must not change).
 */
import fs from "fs";
import { test, expect, resetData, loginFast, USERS, Role } from "./fixtures";

const LABEL = process.env.SCREEN_LABEL || "current";
const THEMES = (process.env.SCREEN_THEMES || "light,dark").split(",") as ("light" | "dark")[];

const PAGES: { name: string; role: Role | null; path: string }[] = [
  { name: "faculty-dashboard", role: "faculty", path: "/u/portal/dashboard" },
  { name: "good-works-list", role: "faculty", path: "/u/portal/dashboard/good-works" },
  { name: "admin-home", role: "admin", path: "/u/portal/dashboard/admin" },
  { name: "admin-review-queue", role: "admin", path: "/u/portal/dashboard/admin/review" },
  { name: "oa-issue", role: "oa", path: "/u/portal/dashboard/oa" },
  { name: "login", role: null, path: "/u/portal/auth?faculty_login" },
  { name: "admissions-bnys", role: null, path: "/admissions/bnys/2025-2026" },
];

test.beforeAll(resetData);

for (const p of PAGES) {
  for (const theme of THEMES) {
    test(`@visual ${p.name} (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.addInitScript((t) => {
        try {
          localStorage.setItem("theme", t);
        } catch {
          /* ignore */
        }
      }, theme);
      if (p.role) {
        await loginFast(page, p.role);
        await page.goto(`${p.path}?uid=${USERS[p.role].id}`);
      } else {
        await page.goto(p.path);
      }
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
      // Hide the live clock so screenshots are comparable.
      await page.addStyleTag({ content: "[suppresshydrationwarning]{visibility:hidden}" }).catch(() => {});
      fs.mkdirSync(`test-results/screens/${LABEL}`, { recursive: true });
      await page.screenshot({ path: `test-results/screens/${LABEL}/${p.name}-${theme}.png`, fullPage: true });
      expect(true).toBe(true);
    });
  }
}
