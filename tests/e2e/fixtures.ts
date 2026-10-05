/**
 * Shared E2E helpers.
 * - Network guard: only localhost traffic is allowed. Everything else is
 *   aborted and recorded; contacting the real backend fails the test.
 * - Fake Cloudflare Turnstile that "solves" itself instantly.
 * - Login helpers (through the real UI, or quickly through the API).
 */
import { test as base, expect, Page } from "@playwright/test";

export const API = "http://127.0.0.1:5050";
export const PASSWORD = "Test-Passw0rd-123!";
export const USERS = {
  admin: { email: "admin@example.org", id: "5a0000000000000000000002", home: "/u/portal/dashboard/admin" },
  oa: { email: "oa1@example.org", id: "5a0000000000000000000003", home: "/u/portal/dashboard/oa" },
  faculty: { email: "faculty1@example.org", id: "5a0000000000000000000005", home: "/u/portal/dashboard" },
  faculty2: { email: "faculty2@example.org", id: "5a0000000000000000000006", home: "/u/portal/dashboard" },
} as const;
export type Role = keyof typeof USERS;

const TURNSTILE_STUB = `
  window.turnstile = {
    render: function (el, opts) { setTimeout(function () { opts && opts.callback && opts.callback('e2e-turnstile-token'); }, 50); return 'w1'; },
    reset: function () {}, remove: function () {}, execute: function () {},
    getResponse: function () { return 'e2e-turnstile-token'; }, isExpired: function () { return false; }
  };
  if (window.cf__reactTurnstileOnLoad) window.cf__reactTurnstileOnLoad();
`;
const PRODUCTION = /faculty-credit-system\.vercel\.app|egspgroup\.in|egspec\.org|amazonaws\.com|firebase|googleapis/i;

export const test = base.extend<{ blocked: string[] }>({
  blocked: async ({ context }, use) => {
    const blocked: string[] = [];
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (["localhost", "127.0.0.1"].includes(url.hostname) || url.protocol === "data:" || url.protocol === "blob:")
        return route.continue();
      if (url.hostname === "challenges.cloudflare.com") {
        return route.fulfill({ status: 200, contentType: "application/javascript", body: TURNSTILE_STUB });
      }
      blocked.push(url.href);
      return route.abort("blockedbyclient");
    });
    await use(blocked);
    const prod = blocked.filter((u) => PRODUCTION.test(u));
    expect(prod, `website tried to contact real services: ${prod.join(", ")}`).toEqual([]);
  },
  page: async ({ page, blocked }, use) => {
    void blocked;
    await use(page);
  },
});
export { expect };

export async function resetData() {
  const res = await fetch(`${API}/__test__/reset`, { method: "POST" });
  if (!res.ok) throw new Error("could not reset test data");
}

export async function apiLogin(role: Role) {
  const res = await fetch(`${API}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: USERS[role].email, password: PASSWORD }),
  });
  const body = await res.json();
  if (!body?.data?.token) throw new Error(`API login failed for ${role}: ${JSON.stringify(body)}`);
  return body.data as { token: string; id: string; role: string; sessionId: string };
}

/** Fast login: put a real token into the browser, then open the role's home page. */
export async function loginFast(page: Page, role: Role) {
  const d = await apiLogin(role);
  await page.addInitScript(
    ([t, r, s]) => {
      if (!localStorage.getItem("token")) {
        localStorage.setItem("token", t);
        localStorage.setItem("userRole", r);
        localStorage.setItem("sessionId", s);
      }
    },
    [d.token, d.role, d.sessionId],
  );
  await page.goto(`${USERS[role].home}?uid=${d.id}`);
  return d;
}

/** Real login through the login form (captcha is the local fake). */
export async function loginUI(page: Page, role: Role) {
  await page.goto("/u/portal/auth?faculty_login");
  await page.getByLabel("Email address").fill(USERS[role].email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  const submit = page.locator('form button[type="submit"]');
  await expect(submit).toBeEnabled();
  await submit.click();
  await page.waitForURL(new RegExp(`${USERS[role].home.replace(/\//g, "\\/")}\\?uid=`));
}

/**
 * After logout the app may redirect more than once (a dashboard request still
 * in flight also sends the user to login - bug F-07). Wait for the final
 * login page and for the browser storage to be cleared.
 */
export async function waitForSignedOut(page: Page) {
  await expect(page).toHaveURL(/\/u\/portal\/auth/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("token")).catch(() => "navigating"), { timeout: 15_000 })
    .toBeNull();
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: /account menu/i }).click();
  await page.getByRole("menuitem", { name: /log ?out|sign ?out/i }).click();
}
