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
 * Register request payload
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

/**
 * Register response
 */
export interface RegisterResponse {
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
   * Registers a new user
   * @param data - User registration data (username, email, and password)
   * @returns Promise with register response
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.post<RegisterResponse>('/api/register', {
      username: data.username.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
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

