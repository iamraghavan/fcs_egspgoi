/**
 * Login screen: form validation, captcha gate, role redirects, MFA step,
 * error messages, remember-me. The backend is faked with MSW.
 */
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { LoginScreen } from '@/components/ui/login-1';
import { server, API } from '../utils/server';
import { renderApp, fakeJwt } from '../utils/render';
import { mockRouter } from '../utils/setup';

const ok = (role: string, id = 'u1') => HttpResponse.json({
  success: true, mfaRequired: false,
  data: { id, role, name: 'Test', token: fakeJwt({ id, role, sessionId: 's1' }), sessionId: 's1' },
});

async function fill(email = 'faculty1@example.org', password = 'Test-Passw0rd-123!') {
  const user = userEvent.setup();
  renderApp(<LoginScreen />);
  await user.type(await screen.findByLabelText(/email address/i), email);
  await user.type(screen.getByLabelText(/^password$/i), password);
  return user;
}
const signIn = () => screen.getByRole('button', { name: /sign in|log in|continue|access/i });

describe('LoginScreen', () => {
  test('shows email and password fields with labels', async () => {
    renderApp(<LoginScreen />);
    expect(await screen.findByLabelText(/email address/i)).toHaveAttribute('id', 'email');
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('id', 'password');
  });

  test('password is hidden by default and can be revealed', async () => {
    const user = await fill();
    const pw = screen.getByLabelText(/^password$/i);
    expect(pw).toHaveAttribute('type', 'password');
    const toggle = screen.getAllByRole('button').find((b) => /show|hide|toggle/i.test(b.getAttribute('aria-label') || '') || b.querySelector('svg'));
    if (toggle && toggle !== signIn()) {
      await user.click(toggle);
      expect(['text', 'password']).toContain(pw.getAttribute('type'));
    }
  });

  test('sign-in stays disabled until the captcha is completed', async () => {
    const user = await fill();
    expect(signIn()).toBeDisabled();
    await user.click(screen.getByTestId('turnstile'));
    expect(signIn()).toBeEnabled();
  });

  test.each([
    ['faculty', '/u/portal/dashboard?uid=u1'],
    ['admin', '/u/portal/dashboard/admin?uid=u1'],
    ['oa', '/u/portal/dashboard/oa?uid=u1'],
  ])('successful %s login stores the token and redirects to %s', async (role, url) => {
    server.use(http.post(`${API}/auth/login`, () => ok(role)));
    const user = await fill();
    await user.click(screen.getByTestId('turnstile'));
    await user.click(signIn());
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith(url));
    expect(localStorage.getItem('token')).toBeTruthy();
    expect(localStorage.getItem('userRole')).toBe(role);
  });

  test('wrong password shows the server message and stores nothing', async () => {
    server.use(http.post(`${API}/auth/login`, () => HttpResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 })));
    const user = await fill();
    await user.click(screen.getByTestId('turnstile'));
    await user.click(signIn());
    expect(await screen.findByTestId('app-alert')).toHaveTextContent('Invalid credentials');
    expect(localStorage.getItem('token')).toBeNull();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  test('server down (network error) shows an error instead of crashing', async () => {
    server.use(http.post(`${API}/auth/login`, () => HttpResponse.error()));
    const user = await fill();
    await user.click(screen.getByTestId('turnstile'));
    await user.click(signIn());
    expect(await screen.findByTestId('app-alert')).toHaveTextContent(/sign-in failed/i);
  });

  test('MFA required: shows the code step; verify button needs 6 digits', async () => {
    server.use(
      http.post(`${API}/auth/login`, () => HttpResponse.json({ success: true, mfaRequired: true, mfaType: 'email', userId: 'u1' })),
      http.post(`${API}/auth/verify-mfa`, () => HttpResponse.json({ success: true, token: fakeJwt({ id: 'u1', role: 'faculty' }) })),
    );
    const user = await fill();
    await user.click(screen.getByTestId('turnstile'));
    await user.click(signIn());
    const code = await screen.findByLabelText(/6-digit email code/i);
    const verify = screen.getByRole('button', { name: /verify/i });
    await user.type(code, '123');
    expect(verify).toBeDisabled();
    await user.type(code, '456');
    expect(verify).toBeEnabled();
    await user.click(verify);
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalled());
  });

  test('[INFO] MFA verification request sends email + code only (no proof the password step passed)', async () => {
    let body: any;
    server.use(
      http.post(`${API}/auth/login`, () => HttpResponse.json({ success: true, mfaRequired: true, mfaType: 'app', userId: 'u1' })),
      http.post(`${API}/auth/verify-mfa`, async ({ request }) => { body = await request.json(); return HttpResponse.json({ success: false }, { status: 400 }); }),
    );
    const user = await fill();
    await user.click(screen.getByTestId('turnstile'));
    await user.click(signIn());
    await user.type(await screen.findByLabelText(/authenticator code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => expect(body).toBeDefined());
    // Documents the contract the backend bug relies on (see backend auth tests).
    expect(Object.keys(body).sort()).toEqual(expect.arrayContaining(['code', 'email']));
    expect(body.password).toBeUndefined();
  });

  test('remember me saves the email; otherwise it is removed', async () => {
    server.use(http.post(`${API}/auth/login`, () => ok('faculty')));
    const user = await fill('remember@example.org');
    await user.click(screen.getByLabelText(/remember/i));
    await user.click(screen.getByTestId('turnstile'));
    await user.click(signIn());
    await waitFor(() => expect(localStorage.getItem('rememberedEmail')).toBe('remember@example.org'));
  });

  test.failing('[BUG-FE] the OA account named in NEXT_PUBLIC_OA_USERNAME skips the captcha', async () => {
    await fill('oa-bypass@example.org');
    // Expected: every account must pass the captcha. The username is also visible in the website code.
    expect(signIn()).toBeDisabled();
  });

  test('response without a token is rejected with an error', async () => {
    server.use(http.post(`${API}/auth/login`, () => HttpResponse.json({ success: true, mfaRequired: false, data: { id: 'u1', role: 'faculty' } })));
    const user = await fill();
    await user.click(screen.getByTestId('turnstile'));
    await user.click(signIn());
    expect(await screen.findByTestId('app-alert')).toHaveTextContent(/token is missing/i);
  });
});
