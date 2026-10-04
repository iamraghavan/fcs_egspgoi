import { API_ORIGIN } from '@/lib/api-url';

const API_BASE_URL = API_ORIGIN;

/**
 * Shortens a link to this application (or its proof storage) using the
 * backend. The backend requires a logged-in user and refuses other websites
 * (SEC-02), so this runs in the browser and sends the user's token.
 * On any failure the original link is returned, so callers never break.
 */
export async function shortenUrl(longUrl: string): Promise<string> {
  if (!longUrl || /\/s\/[0-9a-z]+$/i.test(longUrl)) return longUrl; // already short
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return longUrl;

    const response = await fetch(`${API_BASE_URL}/api/v1/url/shorten`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url: longUrl }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to shorten URL');
    }
    return data.shortUrl;
  } catch (error) {
    console.error('URL Shortener Error:', error);
    return longUrl; // Fallback: return original URL if shortening fails
  }
}
