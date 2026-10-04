/**
 * Login, logout and protected pages in a real browser (local stack).
 */
import { test, expect, resetData, loginUI, loginFast, apiLogin, USERS, API, waitForSignedOut } from './fixtures';

test.beforeAll(resetData);

test.describe('login @cross', () => {
  test('login page loads with the form', async ({ page }) => {
    await page.goto('/u/portal/auth?faculty_login');
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  });

  test('faculty logs in through the form and lands on the faculty dashboard', async ({ page }) => {
    await loginUI(page, 'faculty');
    await expect(page).toHaveURL(new RegExp(`/u/portal/dashboard\\?uid=${USERS.faculty.id}`));
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeTruthy();
  });

  test('wrong password shows an error and stays on the login page', async ({ page }) => {
    await page.goto('/u/portal/auth?faculty_login');
    await page.getByLabel('Email address').fill(USERS.faculty.email);
    await page.getByLabel('Password', { exact: true }).fill('wrong-password');
    const submit = page.locator('form button[type="submit"]');
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/\/u\/portal\/auth/);
  });
});

test.describe('roles land on their own dashboards', () => {
  for (const role of ['admin', 'oa'] as const) {
    test(`${role} logs in through the form`, async ({ page }) => {
      await loginUI(page, role);
      await expect(page).toHaveURL(new RegExp(USERS[role].home));
    });
  }
});

test.describe('protected pages', () => {
  for (const path of ['/u/portal/dashboard', '/u/portal/dashboard/good-works', '/u/portal/dashboard/admin', '/u/portal/dashboard/admin/users', '/u/portal/dashboard/oa']) {
    test(`logged out: ${path} redirects to login @cross`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/\/u\/portal\/auth/);
    });
  }

  test('[BUG-FE] faculty typing an admin URL sees the admin page shell (server still refuses data)', async ({ page }) => {
    test.fail(true, 'Known bug: no role check in the dashboard shell');
    await loginFast(page, 'faculty');
    await page.goto(`/u/portal/dashboard/admin/users?uid=${USERS.faculty.id}`);
    await page.waitForTimeout(3000);
    // Correct behaviour: sent back to the faculty dashboard.
    await expect(page).toHaveURL(/\/u\/portal\/dashboard\?uid=/, { timeout: 5000 });
  });

  test('faculty on an admin page cannot load admin data (backend refuses)', async ({ page }) => {
    const { token } = await apiLogin('faculty');
    const res = await page.request.get(`${API}/api/v1/users`, { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status()).toBe(403);
  });

  test("tampering ?uid= never shows another faculty member's data", async ({ page }) => {
    await loginFast(page, 'faculty');
    await page.goto(`/u/portal/dashboard?uid=${USERS.faculty2.id}`);
    await page.waitForTimeout(3000);
    await expect(page.getByText('faculty faculty2')).toHaveCount(0);
  });

  test('[BUG-FE] tampering ?uid= logs the user OUT ("session expired") instead of correcting the URL', async ({ page }) => {
    test.fail(true, 'Known bug: dashboard treats 403 Forbidden as an expired session');
    await loginFast(page, 'faculty');
    await page.goto(`/u/portal/dashboard?uid=${USERS.faculty2.id}`);
    await page.waitForURL(new RegExp(`uid=${USERS.faculty.id}`), { timeout: 15000 });
  });
});

test('[BUG-FE] @cross one failed or cancelled network request logs the user out (F-07)', async ({ page }) => {
  test.fail(true, 'Known bug F-07: the dashboard shell clears the login on ANY error (e.g. a request cancelled when you click a menu item quickly)');
  await loginFast(page, 'faculty');
  await page.waitForLoadState('networkidle');
  // Simulate a network hiccup on the next page load (this is what happens in Firefox/Safari
  // when you navigate while the dashboard is still loading).
  await page.route('**/api/v1/auth/profile', (route) => route.abort('failed'), { times: 1 });
  await page.goto(`/u/portal/dashboard/good-works?uid=${USERS.faculty.id}`);
  await page.waitForTimeout(3000);
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeTruthy();
});

test.describe('logout', () => {
  test('logout clears the browser and returns to login; back button does not show data', async ({ page }) => {
    await loginUI(page, 'faculty');
    await page.locator('header button').last().click();
    await page.getByRole('menuitem', { name: /log ?out|sign ?out/i }).click();
    await waitForSignedOut(page);
    await page.goBack();
    await page.waitForURL(/\/u\/portal\/auth/);
  });

  test('[FIXED SEC-10] after logout the old token no longer works on the server', async ({ page }) => {
    await loginUI(page, 'faculty');
    const token = await page.evaluate(() => localStorage.getItem('token'));
    await page.locator('header button').last().click();
    await page.getByRole('menuitem', { name: /log ?out|sign ?out/i }).click();
    await waitForSignedOut(page);
    const res = await page.request.get(`${API}/api/v1/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status()).toBe(401);
  });
});
