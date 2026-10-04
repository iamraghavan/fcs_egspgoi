/**
 * One way for the website to call the backend (roadmap Q-11).
 *
 * - Adds the login token (Authorization header, never the URL).
 * - Uses one base address (API_V1).
 * - 401 -> the session is over: clear it and go to the login page.
 * - 403 -> "not allowed": raise an error, but do NOT sign the user out (fixes F-02).
 * - Network failure / cancelled request -> retry once for read requests, then
 *   raise an error, but do NOT sign the user out (fixes F-07).
 *
 * New code should use apiFetch(); older pages still call fetch() directly and
 * can be migrated one at a time.
 */
import { API_V1 } from '@/lib/api-url';

export type ApiErrorKind = 'unauthorized' | 'forbidden' | 'not_found' | 'client' | 'server' | 'network' | 'aborted';

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly body: unknown;

  constructor(message: string, status: number, kind: ApiErrorKind, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind;
    this.body = body;
  }
}

export const LOGIN_PATH = '/u/portal/auth?faculty_login';

type ApiOptions = Omit<RequestInit, 'body'> & {
  /** Plain objects are sent as JSON; FormData is sent as-is. */
  body?: unknown;
  /** Skip the automatic sign-out on 401 (e.g. the login form itself). */
  skipAuthRedirect?: boolean;
  /** Number of retries after a network failure (default: 1 for GET, 0 otherwise). */
  retries?: number;
};

let redirecting = false;

/** Clears the stored session and sends the browser to the login page (once). */
export function signOutLocally(reason = 'session_expired') {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('sessionId');
  localStorage.removeItem('userRole');
  localStorage.removeItem('sessionExpiresAt');
  if (!redirecting) {
    redirecting = true;
    window.location.assign(`${LOGIN_PATH}&reason=${encodeURIComponent(reason)}`);
  }
}

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_V1}${path.startsWith('/') ? '' : '/'}${path}`;
}

async function readBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

function kindFor(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  return status >= 500 ? 'server' : 'client';
}

export async function apiFetch<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, skipAuthRedirect, retries, headers, ...init } = options;
  const method = (init.method || 'GET').toUpperCase();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const finalHeaders = new Headers(headers);
  if (token && !finalHeaders.has('Authorization')) finalHeaders.set('Authorization', `Bearer ${token}`);
  let finalBody: BodyInit | undefined;
  if (body instanceof FormData || body instanceof Blob || typeof body === 'string') {
    finalBody = body as BodyInit;
  } else if (body !== undefined) {
    finalHeaders.set('Content-Type', 'application/json');
    finalBody = JSON.stringify(body);
  }

  const maxRetries = retries ?? (method === 'GET' ? 1 : 0);
  let response: Response | undefined;
  for (let attempt = 0; ; attempt++) {
    try {
      response = await fetch(buildUrl(path), { ...init, method, headers: finalHeaders, body: finalBody });
      break;
    } catch (error: any) {
      if (error?.name === 'AbortError') throw new ApiError('Request was cancelled.', 0, 'aborted');
      if (attempt >= maxRetries) {
        throw new ApiError('Could not reach the server. Please check your connection and try again.', 0, 'network');
      }
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }

  const data = await readBody(response);
  if (response.ok) return data as T;

  const message = (data && typeof data === 'object' && 'message' in data && typeof (data as any).message === 'string')
    ? (data as any).message
    : `Request failed (${response.status}).`;
  const error = new ApiError(message, response.status, kindFor(response.status), data);
  if (error.kind === 'unauthorized' && !skipAuthRedirect) signOutLocally();
  throw error;
}

/** Friendly text for an error from apiFetch, suitable for an alert. */
export function describeApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.kind === 'forbidden') return 'You do not have permission to view or change this.';
    return error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}

/** For tests only. */
export function __resetApiStateForTests() { redirecting = false; }
