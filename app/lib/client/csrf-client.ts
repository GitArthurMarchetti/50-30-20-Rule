/**
 * CSRF Token Client Helper
 * Utility functions for handling CSRF tokens in the frontend
 */

let csrfTokenCache: string | null = null;
let tokenPromise: Promise<string> | null = null;

/**
 * Get CSRF token (with caching)
 * Fetches the token from the server and caches it
 */
export async function getCsrfToken(): Promise<string> {
  // Return cached token if available
  if (csrfTokenCache) {
    return csrfTokenCache;
  }

  // If a request is already in progress, wait for it
  if (tokenPromise) {
    return tokenPromise;
  }

  // Fetch new token
  tokenPromise = fetch('/api/csrf-token')
    .then(async (res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch CSRF token');
      }
      const data = await res.json();
      csrfTokenCache = data.csrfToken;
      return data.csrfToken;
    })
    .finally(() => {
      tokenPromise = null;
    });

  return tokenPromise;
}

/**
 * Clear CSRF token cache (useful after logout)
 */
export function clearCsrfToken(): void {
  csrfTokenCache = null;
  tokenPromise = null;
}

/**
 * Make an authenticated API request with CSRF token
 * Automatically includes CSRF token in headers
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getCsrfToken();

  const headers = new Headers(options.headers);
  
  // Only add CSRF token for state-changing methods
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers.set('X-CSRF-Token', token);
  }

  // Ensure Content-Type is set for JSON requests
  if (!headers.has('Content-Type') && method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies
  });
}
