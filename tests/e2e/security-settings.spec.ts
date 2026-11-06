import { test, expect, resetData, loginFast, USERS } from "./fixtures";

test.beforeEach(resetData);

test("account security page starts both MFA setup flows", async ({ page }) => {
  await loginFast(page, "faculty");
  await page.goto(`/u/portal/dashboard/account/security?uid=${USERS.faculty.id}`);

  await expect(page.getByRole("heading", { name: "Security & sessions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Add a second sign-in factor" })).toBeVisible();
  await page.getByRole("button", { name: "Set Up" }).click();
  const appDialog = page.getByRole("dialog", { name: "Set Up Authenticator App" });
  await expect(appDialog).toBeVisible();
  await expect(appDialog.getByAltText("MFA QR Code")).toBeVisible();
  await appDialog.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("switch", { name: "Email Authentication" }).click();
  await expect(page.getByRole("dialog", { name: "Enable Email MFA" })).toBeVisible();
});
