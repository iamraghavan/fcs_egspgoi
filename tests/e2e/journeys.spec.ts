/**
 * Full user journeys per role in a real browser (local stack).
 * Each step is checked on screen AND in the (local test) database through the API.
 */
import { test, expect, resetData, loginUI, apiLogin, USERS, API, waitForSignedOut } from './fixtures';

const CREDIT_F1_NEG_PENDING = '7c0000000000000000000004'; // seeded title "negative credit 004"

async function apiGet(path: string, role: 'admin' | 'faculty' | 'oa') {
  const { token } = await apiLogin(role);
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

test.beforeEach(resetData);

test('faculty journey: login -> dashboard -> submit good work -> see it pending -> appeal a remark -> logout @cross', async ({ page }) => {
  await loginUI(page, 'faculty');

  // Dashboard loads without an error dialog. (Wait for it to finish: see bug F-07 in auth.spec.ts.)
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Submit a good work.
  await page.goto(`/u/portal/dashboard/good-works/submit?uid=${USERS.faculty.id}`);
  await page.getByRole('combobox', { name: /category/i }).click();
  await page.getByRole('option', { name: 'Research paper published' }).click();
  await page.getByLabel(/achievement title/i).fill('E2E: Published journal paper');
  await page.locator('main form button[type="submit"]').click();
  await expect.poll(async () => {
    const list = await apiGet(`/api/v1/credits/credits/faculty/${USERS.faculty.id}?limit=100`, 'faculty');
    return list.items.find((c: any) => c.title === 'E2E: Published journal paper')?.status;
  }, { timeout: 30_000 }).toBe('pending');

  // It is listed on the Good Works page.
  await page.waitForURL(/good-works\?uid=/); // the app redirects here after submitting
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('E2E: Published journal paper')).toBeVisible();
  await page.waitForTimeout(1500); // let the list finish loading (bug F-07)

  // Appeal a negative remark.
  await page.goto(`/u/portal/dashboard/remarks?uid=${USERS.faculty.id}`);
  await page.getByRole('button', { name: 'Appeal remark: negative credit 004' }).click();
  await page.getByPlaceholder('Enter justification...').fill('E2E: I submitted the marks on time; see attached email.');
  await page.getByRole('dialog').getByRole('button', { name: 'Submit Action' }).click();
  await expect.poll(async () => {
    const c = await apiGet(`/api/v1/credits/credits/${CREDIT_F1_NEG_PENDING}`, 'faculty');
    return c.data?.status;
  }, { timeout: 30_000 }).toBe('appealed');

  // Logout.
  await page.locator('header button').last().click();
  await page.getByRole('menuitem', { name: /log ?out|sign ?out/i }).click();
  await waitForSignedOut(page);
});

test('admin journey: login -> review submissions -> approve one -> faculty total updates', async ({ page }) => {
  const before = (await apiGet(`/api/v1/credits/${USERS.faculty2.id}/credits?recalc=true`, 'admin')).data.currentCredit;
  await loginUI(page, 'admin');
  await page.goto(`/u/portal/dashboard/admin/review?uid=${USERS.admin.id}`);
  await page.getByRole('row', { name: /positive credit 007/i }).click(); // faculty2's pending claim (4 points)
  await page.getByRole('button', { name: 'Approve' }).click();
  await expect.poll(async () => (await apiGet(`/api/v1/credits/${USERS.faculty2.id}/credits`, 'admin')).data.currentCredit, { timeout: 30_000 })
    .toBe(before + 4);
});

test('admin journey: users page lists seeded accounts and search works', async ({ page }) => {
  await loginUI(page, 'admin');
  await page.goto(`/u/portal/dashboard/admin/users?uid=${USERS.admin.id}`);
  await expect(page.getByText('faculty1@example.org')).toBeVisible();
  await page.getByPlaceholder(/search/i).first().fill('faculty2');
  await expect(page.getByText('faculty2@example.org')).toBeVisible();
});

test('OA journey: login -> issue a negative remark -> appears in history and lowers the score', async ({ page }) => {
  const before = (await apiGet(`/api/v1/credits/${USERS.faculty2.id}/credits?recalc=true`, 'admin')).data.currentCredit;
  await loginUI(page, 'oa');
  await page.getByLabel(/faculty member/i).fill('faculty2');
  await page.getByText('faculty faculty2').first().click();
  await page.getByRole('combobox', { name: /remark template/i }).click();
  await page.getByRole('option', { name: /unauthorised absence/i }).click();
  const notes = page.getByLabel(/notes/i);
  if (await notes.count()) await notes.fill('E2E: absent without leave on 12 Sept');
  await page.locator('main form button[type="submit"]').click();
  await expect.poll(async () => (await apiGet(`/api/v1/credits/${USERS.faculty2.id}/credits?recalc=true`, 'admin')).data.currentCredit, { timeout: 30_000 })
    .toBe(before - 5);
  await page.goto(`/u/portal/dashboard/oa/history?uid=${USERS.oa.id}`);
  await expect(page.getByText(/unauthorised absence/i).first()).toBeVisible();
});

test('admin journey: decide an appeal -> deduction removed', async ({ page }) => {
  const seededAppealed = '7c0000000000000000000005'; // faculty1, -5, appeal pending
  const before = (await apiGet(`/api/v1/credits/${USERS.faculty.id}/credits?recalc=true`, 'admin')).data.currentCredit;
  await loginUI(page, 'admin');
  await page.goto(`/u/portal/dashboard/admin/appeals?uid=${USERS.admin.id}`);
  await page.getByRole('button', { name: /open appeal and negative credit details for .*negative credit 005/i }).click();
  await expect(page.getByText(/I was on approved leave/i).first()).toBeVisible();
  const notes = page.getByLabel(/decision rationale/i);
  if (await notes.count()) await notes.fill('E2E: leave record verified');
  await page.getByRole('button', { name: /accept/i }).last().click();
  await expect.poll(async () => (await apiGet(`/api/v1/admin/credits/negative/${seededAppealed}/appeal`, 'admin')).data?.status, { timeout: 30_000 })
    .toBe('accepted');
  const after = (await apiGet(`/api/v1/credits/${USERS.faculty.id}/credits?recalc=true`, 'admin')).data.currentCredit;
  expect(after).toBe(before + 5);
});
