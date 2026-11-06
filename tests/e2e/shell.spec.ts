/**
 * App shell (UI redesign Phase 2): primary rail → secondary panel → workspace.
 */
import { test, expect, resetData, loginFast, USERS } from "./fixtures";

test.beforeAll(resetData);

const D = "/u/portal/dashboard";

test("faculty: rail (≤ 7 items) → panel → page, with breadcrumb", async ({ page }) => {
  await loginFast(page, "faculty");
  await page.goto(`${D}?uid=${USERS.faculty.id}`);

  const rail = page.getByRole("navigation", { name: "Main" });
  const railLinks = rail.getByRole("listitem");
  expect(await railLinks.count()).toBeLessThanOrEqual(7);
  await expect(rail.getByRole("link", { name: "Home", exact: true })).toHaveAttribute("aria-current", "page");

  await rail.getByRole("link", { name: "Good Works", exact: true }).click();
  await page.waitForURL(/\/good-works\?/);
  const panel = page.getByRole("navigation", { name: "Good Works" });
  await expect(panel.getByRole("link", { name: "All Good Works" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("All Good Works");

  await panel.getByRole("link", { name: "Submit Good Work" }).click();
  await page.waitForURL(/\/good-works\/submit\?/);
  await expect(panel.getByRole("link", { name: "Submit Good Work" })).toHaveAttribute("aria-current", "page");
});

test("[G11] faculty opening an admin URL lands on their own Home with a message", async ({ page }) => {
  await loginFast(page, "faculty");
  await page.goto(`${D}/admin/users?uid=${USERS.faculty.id}`);
  await page.waitForURL((u) => u.pathname === D);
  await expect(page.getByText("That page isn't available for your account", { exact: true })).toBeVisible();
});

test("panel collapse and accent colour are remembered after reload", async ({ page }) => {
  await loginFast(page, "faculty");
  await page.goto(`${D}/good-works?uid=${USERS.faculty.id}`);

  await page.getByRole("button", { name: "Hide navigation panel" }).click();
  await expect(page.getByRole("navigation", { name: "Good Works" })).toHaveCount(0);

  await page.getByRole("button", { name: "Appearance" }).click();
  await page.getByRole("menuitemradio", { name: "teal" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-accent", "teal");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-accent", "teal");
  await expect(page.getByRole("button", { name: "Show navigation panel" })).toBeVisible();
  await page.getByRole("button", { name: "Show navigation panel" }).click();
  await expect(page.getByRole("navigation", { name: "Good Works" })).toBeVisible();
});

test("Ctrl+K palette jumps to a create action", async ({ page }) => {
  await loginFast(page, "faculty");
  await page.goto(`${D}?uid=${USERS.faculty.id}`);
  await page.getByRole("navigation", { name: "Main" }).waitFor();
  await page.keyboard.press("Control+k");
  const input = page.getByPlaceholder(/search pages, actions/i);
  await expect(input).toBeVisible();
  await input.fill("submit good");
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/good-works\/submit\?/);
});

test("academic year switcher is shared by pages and kept in the URL", async ({ page }) => {
  await loginFast(page, "faculty");
  await page.goto(`${D}/good-works?uid=${USERS.faculty.id}`);
  const panel = page.getByRole("complementary", { name: "Good Works pages" });
  await panel.getByRole("combobox", { name: "Academic year" }).click();
  await page.getByRole("option", { name: "All years" }).click();
  await page.waitForURL(/ay=all/);

  // Home does not support "All years": it falls back to the current year, and the choice is not lost.
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Home", exact: true }).click();
  await page.waitForURL((u) => u.pathname === D);
  await expect(
    page.getByRole("complementary", { name: "Home pages" }).getByRole("combobox", { name: "Academic year" }),
  ).toContainText(/AY \d{4}-\d{2}/);
});

test("admin and OA rails show their own modules", async ({ page }) => {
  await loginFast(page, "admin");
  await page.goto(`${D}/admin?uid=${USERS.admin.id}`);
  const rail = page.getByRole("navigation", { name: "Main" });
  for (const name of ["Home", "Review", "Credits", "People", "Reports", "Setup", "My account"]) {
    await expect(rail.getByRole("link", { name, exact: true })).toBeVisible();
  }
  await rail.getByRole("link", { name: "Credits" }).click();
  await expect(
    page.getByRole("navigation", { name: "Credits" }).getByRole("link", { name: "Credit Templates" }),
  ).toBeVisible();
});
