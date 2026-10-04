/**
 * Shared API client (roadmap Q-11): token handling and consistent errors.
 */
import { http, HttpResponse } from 'msw';
import { apiFetch, ApiError, describeApiError, __resetApiStateForTests } from '@/lib/api';
import { server, API } from '../utils/server';

const assign = jest.fn();
beforeAll(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: { ...window.location, assign } });
});
beforeEach(() => { __resetApiStateForTests(); assign.mockClear(); });

test('sends the token in the Authorization header and parses JSON', async () => {
  localStorage.setItem('token', 'tok');
  let auth: string | null = null;
  server.use(http.get(`${API}/things`, ({ request }) => { auth = request.headers.get('authorization'); return HttpResponse.json({ ok: 1 }); }));
  expect(await apiFetch('/things')).toEqual({ ok: 1 });
  expect(auth).toBe('Bearer tok');
});

test('JSON bodies are serialised; FormData is sent as-is', async () => {
  let type: string | null = null;
  server.use(http.post(`${API}/json`, ({ request }) => { type = request.headers.get('content-type'); return HttpResponse.json({}); }));
  await apiFetch('/json', { method: 'POST', body: { a: 1 } });
  expect(type).toBe('application/json');
});

test('401: clears the session and goes to the login page', async () => {
  localStorage.setItem('token', 'expired');
  server.use(http.get(`${API}/me`, () => HttpResponse.json({ message: 'Session expired' }, { status: 401 })));
  await expect(apiFetch('/me')).rejects.toMatchObject({ kind: 'unauthorized', status: 401 });
  expect(localStorage.getItem('token')).toBeNull();
  expect(assign).toHaveBeenCalledWith(expect.stringContaining('/u/portal/auth'));
});

test('403: raises "forbidden" but does NOT sign the user out (F-02)', async () => {
  localStorage.setItem('token', 'tok');
  server.use(http.get(`${API}/admin`, () => HttpResponse.json({ message: 'Forbidden' }, { status: 403 })));
  const error = await apiFetch('/admin').catch((e) => e);
  expect(error).toBeInstanceOf(ApiError);
  expect(error.kind).toBe('forbidden');
  expect(localStorage.getItem('token')).toBe('tok');
  expect(assign).not.toHaveBeenCalled();
  expect(describeApiError(error)).toMatch(/permission/);
});

test('network failure: GET is retried once, then fails WITHOUT signing out (F-07)', async () => {
  localStorage.setItem('token', 'tok');
  let calls = 0;
  server.use(http.get(`${API}/flaky`, () => { calls += 1; return HttpResponse.error(); }));
  await expect(apiFetch('/flaky')).rejects.toMatchObject({ kind: 'network' });
  expect(calls).toBe(2);
  expect(localStorage.getItem('token')).toBe('tok');
  expect(assign).not.toHaveBeenCalled();
});

test('network failure recovers on retry', async () => {
  let calls = 0;
  server.use(http.get(`${API}/recover`, () => (++calls === 1 ? HttpResponse.error() : HttpResponse.json({ fine: true }))));
  expect(await apiFetch('/recover')).toEqual({ fine: true });
});

test('POST is not retried automatically', async () => {
  let calls = 0;
  server.use(http.post(`${API}/once`, () => { calls += 1; return HttpResponse.error(); }));
  await expect(apiFetch('/once', { method: 'POST', body: {} })).rejects.toMatchObject({ kind: 'network' });
  expect(calls).toBe(1);
});

test('server errors keep the server message', async () => {
  server.use(http.get(`${API}/boom`, () => HttpResponse.json({ message: 'Database unavailable' }, { status: 500 })));
  await expect(apiFetch('/boom')).rejects.toMatchObject({ kind: 'server', message: 'Database unavailable' });
});
