import { test, expect, resetData, loginFast, apiLogin, API, USERS } from "./fixtures";

const D = "/u/portal/dashboard";

test.beforeEach(resetData);

test("admin adds a single faculty user and the backend returns its institution assignment", async ({ page }) => {
  const { token } = await apiLogin("admin");
  const settingsResponse = await fetch(`${API}/api/v1/settings`, { headers: { Authorization: `Bearer ${token}` } });
  expect(settingsResponse.ok).toBeTruthy();
  const settings = (await settingsResponse.json()).data;
  const college = settings.colleges.find(
    (item: any) => item.active && item.departments.some((department: any) => department.active),
  );
  expect(college).toBeTruthy();
  const department = college.departments.find((item: any) => item.active);

  await loginFast(page, "admin");
  await page.goto(`${D}/admin/users/new?uid=${USERS.admin.id}`);
  await expect(page.getByRole("heading", { name: "Add a single user" })).toBeVisible();
  await page.getByLabel("Full name").fill("Playwright Single User");
  await page.getByLabel("Email", { exact: true }).fill("playwright.single@example.org");
  const initialPassword = page.getByLabel("Initial password", { exact: true });
  const suggestedPassword = await initialPassword.inputValue();
  expect(suggestedPassword.length).toBeGreaterThanOrEqual(settings.passwordMinLength);
  expect(suggestedPassword).toMatch(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/);
  await page.getByRole("button", { name: "Show initial password" }).click();
  await expect(initialPassword).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Generate another" }).click();
  await expect(initialPassword).not.toHaveValue(suggestedPassword);
  await initialPassword.fill("Test-Passw0rd-123!");
  await page.getByRole("combobox", { name: "College" }).click();
  await page.getByRole("option", { name: college.name, exact: true }).click();
  await page.getByRole("combobox", { name: /Department/ }).click();
  await page.getByRole("option", { name: department.name, exact: true }).click();
  await page.getByRole("button", { name: "Create user" }).click();
  await expect(page.getByRole("heading", { name: "Account created for Playwright Single User" })).toBeVisible();
  await expect(page.getByLabel("Initial password", { exact: true })).toHaveValue("Test-Passw0rd-123!");
  await page.getByRole("button", { name: "Done" }).click();
  await page.waitForURL((url) => url.pathname === `${D}/admin/users`);

  const usersResponse = await fetch(`${API}/api/v1/users?q=playwright.single%40example.org`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(usersResponse.ok).toBeTruthy();
  const users = await usersResponse.json();
  expect(users.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        email: "playwright.single@example.org",
        role: "faculty",
        college: college.name,
        department: department.name,
      }),
    ]),
  );
});

test("admin setup and personal settings use separate sidebar pages, with top bar controls", async ({ page }) => {
  await loginFast(page, "admin");
  await page.goto(`${D}/admin/setup/academic-years?uid=${USERS.admin.id}`);
  await expect(page.getByRole("heading", { name: "Academic years", level: 1 })).toBeVisible();
  const setup = page.getByRole("navigation", { name: "Setup" });
  await expect(setup.getByRole("link", { name: "Institutions & departments" })).toBeVisible();
  await expect(setup.getByRole("link", { name: "Application controls" })).toBeVisible();
  await expect(page.getByRole("tablist")).toHaveCount(0);

  await page.getByRole("button", { name: /^Notifications/ }).click();
  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  await page.getByRole("button", { name: /Account menu for/ }).click();
  await expect(page.getByRole("menuitem", { name: /My profile/ })).toBeVisible();
  await page.getByRole("menuitem", { name: /My profile/ }).click();
  await page.waitForURL((url) => url.pathname === `${D}/account/profile`);
  await expect(
    page.getByRole("navigation", { name: "My account" }).getByRole("link", { name: "Appearance" }),
  ).toBeVisible();
});

test("faculty has top bar notifications and personal settings but cannot open application setup", async ({ page }) => {
  await loginFast(page, "faculty");
  await expect(page.getByRole("button", { name: /^Notifications/ })).toBeVisible();
  await page.goto(`${D}/account/preferences?uid=${USERS.faculty.id}`);
  await expect(page.getByRole("heading", { name: /Appearance/ })).toBeVisible();
  await page.goto(`${D}/admin/setup/organization?uid=${USERS.faculty.id}`);
  await page.waitForURL((url) => url.pathname === D);
});

test("office assistant sees the faculty directory without administrator controls", async ({ page }) => {
  await loginFast(page, "oa");
  await page.goto(`${D}/admin/users?uid=${USERS.oa.id}`);
  await expect(page.getByText("faculty1@example.org")).toBeVisible();
  await expect(page.getByRole("link", { name: "Add single user" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Import users from spreadsheet" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Edit faculty/ })).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "Select all accounts on this page" })).toHaveCount(0);
});
