/**
 * Protected routes: what the dashboard shell (DashboardClientWrapper) does
 * when the visitor is logged out, has an expired/revoked token, or opens a
 * page that does not match their role.
 */
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import DashboardClientWrapper from '@/components/dashboard-client-wrapper';
import { SidebarProvider } from '@/components/ui/sidebar';
import { server, API } from '../utils/server';
import { renderApp } from '../utils/render';
import { mockRouter, mockNav, mockLocationAssign } from '../utils/setup';

const SECRET = 'secret page content';
const profile = (role: string, id = 'u1') => http.get(`${API}/auth/profile`, () =>
  HttpResponse.json({ success: true, user: { _id: id, name: 'Test User', email: 't@example.org', role, whatsappVerified: true } }));
const quietExtras = [
  http.get(`${API}/notifications`, () => HttpResponse.json({ success: true, items: [], unreadCount: 0 })),
];

function renderShell() {
  return renderApp(
    <SidebarProvider>
      <DashboardClientWrapper><p>{SECRET}</p></DashboardClientWrapper>
    </SidebarProvider>,
  );
}

describe('dashboard route protection', () => {
  test('logged out (no token): redirected to login, page content never shown', async () => {
    renderShell();
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/u/portal/auth?faculty_login'));
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });

  test.each([
    [401, 'session_expired'],
    [403, 'unauthorized'], // 403 on the profile = account deactivated
  ])('server answers %d: storage cleared and sent to login (%s)', async (status, reason) => {
    localStorage.setItem('token', 'expired');
    localStorage.setItem('userRole', 'faculty');
    server.use(http.get(`${API}/auth/profile`, () => HttpResponse.json({ success: false }, { status })));
    renderShell();
    await waitFor(() => expect(mockLocationAssign).toHaveBeenCalledWith(`/u/portal/auth?faculty_login&reason=${reason}`));
    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });

  test('[FIXED F-07] server error (500): message shown, user stays signed in', async () => {
    localStorage.setItem('token', 't');
    server.use(http.get(`${API}/auth/profile`, () => HttpResponse.json({ message: 'boom' }, { status: 500 })));
    renderShell();
    expect(await screen.findByTestId('app-alert')).toHaveTextContent(/connection problem.*boom/i);
    expect(localStorage.getItem('token')).toBe('t');
    expect(mockLocationAssign).not.toHaveBeenCalled();
  });

  test('[FIXED F-07] network failure: message shown, user stays signed in', async () => {
    localStorage.setItem('token', 't');
    server.use(http.get(`${API}/auth/profile`, () => HttpResponse.error()));
    renderShell();
    expect(await screen.findByTestId('app-alert')).toHaveTextContent(/could not reach the server/i);
    expect(localStorage.getItem('token')).toBe('t');
  });

  test('valid faculty on a faculty page: content shown', async () => {
    localStorage.setItem('token', 't');
    mockNav.search = new URLSearchParams('uid=u1');
    server.use(profile('faculty'), ...quietExtras);
    renderShell();
    expect(await screen.findByText(SECRET)).toBeInTheDocument();
  });

  test('?uid= of another user in the URL is replaced with your own id', async () => {
    localStorage.setItem('token', 't');
    mockNav.search = new URLSearchParams('uid=someone-else');
    server.use(profile('faculty', 'u1'), ...quietExtras);
    renderShell();
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/u/portal/dashboard?uid=u1'));
  });

  test.failing('[BUG-FE] a faculty member opening an ADMIN page URL is not redirected away (no role check)', async () => {
    localStorage.setItem('token', 't');
    mockNav.pathname = '/u/portal/dashboard/admin/users';
    mockNav.search = new URLSearchParams('uid=u1');
    server.use(profile('faculty'), ...quietExtras);
    renderShell();
    await screen.findByText(/test user/i).catch(() => null);
    // Expected: redirected or content hidden. Actual: the admin page renders (the backend still refuses its data).
    await waitFor(() => expect(screen.queryByText(SECRET)).not.toBeInTheDocument());
    expect(mockRouter.replace).toHaveBeenCalled();
  });

  test.failing('[BUG-FE] a faculty member opening an OA page URL is not redirected away', async () => {
    localStorage.setItem('token', 't');
    mockNav.pathname = '/u/portal/dashboard/oa';
    mockNav.search = new URLSearchParams('uid=u1');
    server.use(profile('faculty'), ...quietExtras);
    renderShell();
    await new Promise((r) => setTimeout(r, 300));
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });
});
