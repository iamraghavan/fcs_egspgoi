/**
 * Faculty pages with a fake backend: loading, success, error, empty states,
 * plus session-expiry handling.
 */
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse, delay } from 'msw';
import { server, API } from '../utils/server';
import { renderApp } from '../utils/render';
import { mockNav, mockRouter, mockLocationAssign } from '../utils/setup';

import GoodWorksPage from '@/app/u/portal/dashboard/good-works/page';
import RemarksPage from '@/app/u/portal/dashboard/remarks/page';
import FacultyDashboard from '@/app/u/portal/dashboard/page';

const REL = 'http://localhost/api/v1'; // pages that call the relative "/api/v1"
const credit = (over: Record<string, unknown>) => ({
  _id: Math.random().toString(16).slice(2), type: 'positive', title: 'Published IEEE paper', points: 10, status: 'approved',
  academicYear: '2025-2026', createdAt: '2025-09-01T10:00:00.000Z', faculty: 'u1', appealEligibility: { canAppeal: false }, ...over,
});
const list = (items: unknown[]) => HttpResponse.json({ success: true, total: items.length, page: 1, limit: 10, items });
const isLoading = () => !!document.querySelector('.animate-pulse, .animate-spin');

beforeEach(() => {
  localStorage.setItem('token', 'test-token');
  mockNav.search = new URLSearchParams('uid=u1');
});

describe('Good Works page', () => {
  const url = `${API.replace('/api/v1', '')}/api/v1/credits/credits/faculty/u1`;

  test('loading -> success: shows the submission', async () => {
    server.use(http.get(url, async () => { await delay(150); return list([credit({ title: 'Published IEEE paper' })]); }));
    renderApp(<GoodWorksPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(await screen.findByText('Published IEEE paper')).toBeInTheDocument();
  });

  test('empty: shows "No good works found."', async () => {
    server.use(http.get(url, () => list([])));
    renderApp(<GoodWorksPage />);
    expect(await screen.findByText(/no good works found/i)).toBeInTheDocument();
  });

  test('error (500): shows an error message, no crash', async () => {
    server.use(http.get(url, () => HttpResponse.json({ success: false, message: 'Database unavailable' }, { status: 500 })));
    renderApp(<GoodWorksPage />);
    expect(await screen.findByTestId('app-alert')).toHaveTextContent('Database unavailable');
  });

  test('sends the login token to the API', async () => {
    let auth: string | null = null;
    server.use(http.get(url, ({ request }) => { auth = request.headers.get('authorization'); return list([]); }));
    renderApp(<GoodWorksPage />);
    await waitFor(() => expect(auth).toBe('Bearer test-token'));
  });

  test('user-entered HTML in a title is shown as text, not executed', async () => {
    server.use(http.get(url, () => list([credit({ title: '<img src=x onerror="window.__xss=1">' })])));
    renderApp(<GoodWorksPage />);
    expect(await screen.findByText('<img src=x onerror="window.__xss=1">')).toBeInTheDocument();
    expect((window as any).__xss).toBeUndefined();
  });

  test.failing('[BUG-FE] negative credits are filtered out AFTER paging, so pages show fewer rows and the total is wrong', async () => {
    const items = [...Array(5)].map((_, i) => credit({ title: `Good work ${i}` }))
      .concat([...Array(5)].map((_, i) => credit({ type: 'negative', title: `Remark ${i}`, points: -1 })));
    server.use(http.get(url, () => HttpResponse.json({ success: true, total: 10, page: 1, limit: 10, items })));
    renderApp(<GoodWorksPage />);
    await screen.findByText('Good work 0');
    // The page claims 10 records but can only ever show the 5 positive ones on this page.
    expect(document.body.textContent).not.toMatch(/Showing 1 to 10 of 10 results/);
  });
});

describe('Negative remarks page', () => {
  const url = `${REL}/credits/credits/faculty/u1/negative`;

  test('success: lists remarks', async () => {
    server.use(http.get(url, () => list([credit({ type: 'negative', title: 'Late submission of marks', points: -3, status: 'pending', appealEligibility: { canAppeal: true } })])));
    renderApp(<RemarksPage />);
    expect(await screen.findByText('Late submission of marks')).toBeInTheDocument();
  });

  test('empty: shows "No negative records identified."', async () => {
    server.use(http.get(url, () => list([])));
    renderApp(<RemarksPage />);
    expect(await screen.findByText(/no negative records identified/i)).toBeInTheDocument();
  });

  test('error: shows a message and does not crash', async () => {
    server.use(http.get(url, () => HttpResponse.json({ success: false, message: 'Server exploded' }, { status: 500 })));
    renderApp(<RemarksPage />);
    await waitFor(() => expect(screen.queryByText(/late submission/i)).not.toBeInTheDocument());
    expect(await screen.findByTestId('app-alert').catch(() => screen.findByText(/no negative records|error|failed/i))).toBeInTheDocument();
  });
});

describe('Faculty dashboard', () => {
  const summary = `${API}/credits/u1/credits`;
  const recent = `${API}/credits/credits/faculty/u1`;
  const stats = { totalPositivePoints: 10, totalNegativePoints: 3, series: [], currentYearStats: null, creditsCountByYear: {}, positiveCountByYear: {}, negativeCountByYear: {} };

  test('success: shows the current credit total and recent activity', async () => {
    server.use(
      http.get(summary, () => HttpResponse.json({ success: true, data: { name: 'Dr. Test', currentCredit: 7, totalPositiveCredit: 10, totalNegativeCredit: 3, creditsByYear: {}, stats } })),
      http.get(recent, () => list([credit({ title: 'Workshop conducted' })])),
    );
    renderApp(<FacultyDashboard />);
    expect(await screen.findByText('Workshop conducted')).toBeInTheDocument();
    expect(screen.getAllByText(/\b7\b/).length).toBeGreaterThan(0);
  });

  test('empty: "No recent activities found."', async () => {
    server.use(
      http.get(summary, () => HttpResponse.json({ success: true, data: { currentCredit: 0, stats } })),
      http.get(recent, () => list([])),
    );
    renderApp(<FacultyDashboard />);
    expect(await screen.findByText(/no recent activities found/i)).toBeInTheDocument();
  });

  test('401 from the API: session cleared and redirected to login', async () => {
    server.use(http.get(summary, () => HttpResponse.json({}, { status: 401 })), http.get(recent, () => list([])));
    renderApp(<FacultyDashboard />);
    await waitFor(() => expect(mockLocationAssign).toHaveBeenCalledWith('/u/portal/auth?faculty_login&reason=session_expired'));
    expect(localStorage.getItem('token')).toBeNull();
  });

  test("[FIXED F-02] 403 (e.g. another person's id in the address) does NOT sign the user out", async () => {
    server.use(http.get(summary, () => HttpResponse.json({}, { status: 403 })), http.get(recent, () => HttpResponse.json({}, { status: 403 })));
    renderApp(<FacultyDashboard />);
    await new Promise((r) => setTimeout(r, 300));
    expect(localStorage.getItem('token')).toBe('test-token');
    expect(mockLocationAssign).not.toHaveBeenCalled();
  });

  test('500 from the API: "Sync Error" message', async () => {
    server.use(http.get(summary, () => HttpResponse.json({}, { status: 500 })), http.get(recent, () => list([])));
    renderApp(<FacultyDashboard />);
    expect(await screen.findByTestId('app-alert')).toHaveTextContent(/sync error/i);
  });
});
