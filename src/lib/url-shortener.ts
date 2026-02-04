
"use server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * Shortens a long URL using the backend API.
 * @param {string} longUrl - The URL to shorten.
 * @param {string} [customAlias] - Optional custom alias (e.g., 'promo-2024').
 * @returns {Promise<string>} - The full short URL.
 */
export async function shortenUrl(longUrl: string, customAlias: string | null = null): Promise<string> {
  try {
    const payload: { url: string; alias?: string } = { url: longUrl };
    if (customAlias) {
      payload.alias = customAlias;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/url/shorten`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to shorten URL');
    }
    return data.shortUrl;
  } catch (error) {
    console.error('URL Shortener Error:', error);
    return longUrl; // Fallback: return original URL if shortening fails
  }
}
