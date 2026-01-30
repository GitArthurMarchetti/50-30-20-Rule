/**
 * Base API Client class following SOLID principles
 * Provides a centralized way to handle HTTP requests with consistent error handling
 */
import { getCsrfToken } from './csrf-client';

export class ApiError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Base request method that handles all HTTP requests
   * @param endpoint - API endpoint path
   * @param options - Fetch options
   * @param timeout - Request timeout in milliseconds (default: 30 seconds)
   * @returns Promise with typed response
   */
  protected async request<T>(
    endpoint: string,
    options?: RequestInit,
    timeout: number = 30000
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string>),
      };

      // Add CSRF token for state-changing methods
      const method = (options?.method || 'GET').toUpperCase();
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        try {
          const csrfToken = await getCsrfToken();
          if (!csrfToken) {
            throw new Error('CSRF token is empty');
          }
          // Use lowercase header name to match server expectation
          headers['x-csrf-token'] = csrfToken;
        } catch (error) {
          // If CSRF token fetch fails, throw error to prevent request
          // This ensures we never send requests without CSRF protection
          throw new ApiError(
            `Failed to obtain CSRF token: ${error instanceof Error ? error.message : 'Unknown error'}`,
            500
          );
        }
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
        credentials: 'include', // Include cookies for session
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(
          error.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout. Please try again.', 408);
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error occurred',
        0
      );
    }
  }

  /**
   * GET request with query parameters
   */
  protected get<T>(
    endpoint: string, 
    params?: Record<string, string | number | boolean>
  ): Promise<T> {
    const queryString = params 
      ? '?' + new URLSearchParams(
          Object.entries(params).map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET' });
  }

  /**
   * POST request with body
   */
  protected post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request with body
   */
  protected put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  protected delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export default ApiClient;

