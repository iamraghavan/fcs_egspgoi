import { test, expect, resetData, loginFast, apiLogin, API, USERS } from "./fixtures";

const D = "/u/portal/dashboard";

test.beforeEach(resetData);

test("admin dashboard shows API-backed metrics and charts for the selected academic year", async ({ page }) => {
  const { token } = await apiLogin("admin");
  const response = await fetch(`${API}/api/v1/analytics/dashboard?academicYear=2025-26`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok).toBeTruthy();
  const overview = await response.json();

  await loginFast(page, "admin");
  await page.goto(`${D}/admin?uid=${USERS.admin.id}&ay=2025-26`);
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  const statistics = page.getByRole("region", { name: "Key statistics" });
  await expect(statistics.getByText("Awaiting review")).toBeVisible();
  await expect(statistics.getByText("Open appeals")).toBeVisible();
  await expect(statistics.getByText("Credit records")).toBeVisible();
  await expect(
    statistics
      .getByRole("link", { name: /Credit records/ })
      .getByText(String(overview.summary.totalRecords), { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Credit activity", { exact: true })).toBeVisible();
  await expect(page.getByText("Submission decisions", { exact: true })).toBeVisible();
  await expect(page.getByText("College activity", { exact: true })).toBeVisible();
  await expect(page.getByText("Recent credit activity", { exact: true })).toBeVisible();
  await expect(page.locator('main [role="alert"]')).toHaveCount(0);

  await page.getByRole("combobox", { name: "Dashboard academic year" }).click();
  await page.getByRole("option", { name: "AY 2024-25" }).click();
  await expect(statistics.getByText("Credit records")).toBeVisible();
  await expect(page.getByText("No credit activity is recorded for this academic year.")).toBeVisible();
  await expect(statistics.getByText("0", { exact: true }).first()).toBeVisible();
});

test("dashboard stays usable on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginFast(page, "admin");
  await page.goto(`${D}/admin?uid=${USERS.admin.id}&ay=2025-26`);
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Key statistics" }).getByText("Awaiting review")).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
});
