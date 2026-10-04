/**
 * Admin / OA / notification pages with a fake backend.
 */
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, API } from '../utils/server';
import { renderApp } from '../utils/render';
import { mockNav } from '../utils/setup';

import AdminUsersPage from '@/app/u/portal/dashboard/admin/users/page';
import OaHistoryPage from '@/app/u/portal/dashboard/oa/history/page';
import NotificationsPage from '@/app/u/portal/dashboard/notifications/page';

const user = (over: Record<string, unknown> = {}) => ({
  _id: Math.random().toString(16).slice(2), name: 'Dr. Asha Kumar', email: 'asha@example.org', role: 'faculty',
  college: 'EGS Pillay Engineering College', department: 'CSE', isActive: true, facultyID: 'EGSP/EC/12345', ...over,
});

beforeEach(() => {
  localStorage.setItem('token', 'admin-token');
  mockNav.search = new URLSearchParams('uid=admin1');
  // Lookups some pages make on load; answered with empty data.
  server.use(
    http.get(`${API}/admin/credit-title`, () => HttpResponse.json({ success: true, items: [] })),
    http.get(`${API}/credits/credit-title`, () => HttpResponse.json({ success: true, items: [] })),
  );
});

describe('Admin > Users', () => {
  test('success: shows users from the API', async () => {
    server.use(http.get(`${API}/users`, () => HttpResponse.json({ success: true, total: 1, items: [user()] })));
    renderApp(<AdminUsersPage />);
    expect(await screen.findByText('Dr. Asha Kumar')).toBeInTheDocument();
  });

  test('error: "Failed to Fetch Users" alert', async () => {
    server.use(http.get(`${API}/users`, () => HttpResponse.json({ success: false, message: 'Forbidden - Admin only' }, { status: 403 })));
    renderApp(<AdminUsersPage />);
    expect(await screen.findByTestId('app-alert')).toHaveTextContent(/failed to fetch users.*forbidden/i);
  });

  test('no token: "Admin token not found" alert, no API call', async () => {
    localStorage.clear();
    let called = false;
    server.use(http.get(`${API}/users`, () => { called = true; return HttpResponse.json({}); }));
    renderApp(<AdminUsersPage />);
    expect(await screen.findByTestId('app-alert')).toHaveTextContent(/admin token not found/i);
    expect(called).toBe(false);
  });

  test('user list request sends search text to the API', async () => {
    const queries: string[] = [];
    server.use(http.get(`${API}/users`, ({ request }) => { queries.push(new URL(request.url).search); return HttpResponse.json({ success: true, total: 0, items: [] }); }));
    renderApp(<AdminUsersPage />);
    const search = await screen.findByPlaceholderText(/search/i);
    await userEvent.setup().type(search, 'asha');
    await waitFor(() => expect(queries.some((q) => q.includes('q=asha'))).toBe(true), { timeout: 3000 });
  });
});

describe('OA > Issued history', () => {
  const url = `${API}/admin/oa/credits/issued`;
  const remark = { _id: 'c1', type: 'negative', title: 'Late submission of marks', points: -3, status: 'pending', academicYear: '2025-2026', createdAt: '2025-09-01T10:00:00.000Z', facultySnapshot: { name: 'Dr. Asha Kumar' } };

  test('success: lists credits issued by the OA', async () => {
    server.use(http.get(url, () => HttpResponse.json({ success: true, items: [remark], data: { total: 1, totalFiltered: 1 } })));
    renderApp(<OaHistoryPage />);
    expect(await screen.findByText('Late submission of marks')).toBeInTheDocument();
  });

  test('empty: "No records matched."', async () => {
    server.use(http.get(url, () => HttpResponse.json({ success: true, items: [], data: { total: 0 } })));
    renderApp(<OaHistoryPage />);
    expect(await screen.findByText(/no records matched/i)).toBeInTheDocument();
  });

  test('error: "History unavailable" alert', async () => {
    server.use(http.get(url, () => HttpResponse.json({ success: false, message: 'Missing permission' }, { status: 403 })));
    renderApp(<OaHistoryPage />);
    expect(await screen.findByTestId('app-alert')).toHaveTextContent(/history unavailable.*missing permission/i);
  });

  test.failing('[BUG-FE] with no token the page stays in "loading" forever (no message)', async () => {
    localStorage.clear();
    renderApp(<OaHistoryPage />);
    await new Promise((r) => setTimeout(r, 500));
    // Expected: a login prompt / error. The loader never stops because the function returns early.
    expect(screen.queryByTestId('app-alert') || screen.queryByText(/no records matched/i)).toBeInTheDocument();
  });
});

describe('Notifications', () => {
  const url = `${API}/notifications`;

  test('success: shows notifications', async () => {
    server.use(http.get(url, () => HttpResponse.json({ success: true, items: [
      { _id: 'n1', type: 'credit_approved', title: 'Credit Approved', message: 'Your credit was approved.', read: false, createdAt: '2025-09-01T10:00:00.000Z' },
    ], unreadCount: 1 })));
    renderApp(<NotificationsPage />);
    expect(await screen.findByText('Credit Approved')).toBeInTheDocument();
  });

  test('items are keyboard-accessible (focusable, role=button)', async () => {
    server.use(http.get(url, () => HttpResponse.json({ success: true, items: [
      { _id: 'n1', type: 'general', title: 'Hello', message: 'm', read: false, createdAt: '2025-09-01T10:00:00.000Z' },
    ] })));
    renderApp(<NotificationsPage />);
    const item = (await screen.findByText('Hello')).closest('article');
    expect(item).toHaveAttribute('tabindex', '0');
    expect(item).toHaveAttribute('role', 'button');
  });

  test('error: page does not crash and shows no items', async () => {
    server.use(http.get(url, () => HttpResponse.json({ message: 'down' }, { status: 500 })));
    renderApp(<NotificationsPage />);
    await waitFor(() => expect(document.querySelector('.animate-pulse')).toBeNull());
    expect(screen.queryByRole('article')).toBeNull();
  });
});
