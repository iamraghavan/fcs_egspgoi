import { test, expect, resetData, loginFast, USERS } from "./fixtures";

test.beforeEach(resetData);

test("notification inbox shows a recoverable storage error and loads after retry", async ({ page }) => {
  await loginFast(page, "faculty");
  await page.route("**/api/v1/notifications?limit=200", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        code: "STORAGE_UNAVAILABLE",
        message: "Application storage is unavailable.",
      }),
    });
  });
  await page.goto(`/u/portal/dashboard/notifications?uid=${USERS.faculty.id}`);
  await expect(page.getByRole("alert").filter({ hasText: "Could not load your notification inbox" })).toBeVisible();
  await expect(page.getByText("No notifications")).toHaveCount(0);
  await page.unroute("**/api/v1/notifications?limit=200");
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Could not load your notification inbox" })).toHaveCount(0);
  await expect(page.getByText("No notifications")).toBeVisible();
});
