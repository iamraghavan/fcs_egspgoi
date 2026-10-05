/**
 * Theme toggle (UI redesign Phase 1): light / dark / system, remembered on this
 * device, and never applied to the admissions microsite.
 */
import { test, expect, resetData, loginFast, USERS } from "./fixtures";

test.beforeAll(resetData);

test("theme toggle switches to dark, survives reload and sign-in state", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await loginFast(page, "faculty");
  await page.goto(`/u/portal/dashboard?uid=${USERS.faculty.id}`);

  const html = page.locator("html");
  await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);

  await page.getByRole("button", { name: "Appearance" }).click();
  await page.getByRole("menuitemradio", { name: "Dark" }).click();
  await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");

  await page.reload();
  await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);

  await page.getByRole("button", { name: "Appearance" }).click();
  await page.getByRole("menuitemradio", { name: "Match system" }).click();
  await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/); // system = light here
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("system");
});

test("admissions microsite keeps the legacy light look even when dark is chosen", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => {
    try {
      localStorage.setItem("theme", "dark");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/admissions/bnys/2025-2026");
  const scope = page.locator(".legacy-theme").first();
  await expect(scope).toBeVisible();
  // The legacy scope pins the old white background regardless of the theme.
  const bg = await scope.evaluate((el) => getComputedStyle(el).getPropertyValue("--background").trim());
  expect(bg).toBe("0 0% 100%");
  await expect(page.locator("html")).toHaveClass(/legacy-theme/);
});
