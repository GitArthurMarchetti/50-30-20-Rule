import ApiClient from './api-client';

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  message: string;
}

/**
 * Auth Service - handles authentication-related API calls
 * Follows Single Responsibility Principle
 */
class AuthService extends ApiClient {
  /**
   * Logs in a user
   * @param credentials - User credentials (email and password)
   * @returns Promise with login response
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.post<LoginResponse>('/api/login', {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });
  }

  /**
   * Logs out the current user
   * @returns Promise
   */
  async logout(): Promise<void> {
    return this.post('/api/logout', {});
  }
}

// Export singleton instance
export const authService = new AuthService();

