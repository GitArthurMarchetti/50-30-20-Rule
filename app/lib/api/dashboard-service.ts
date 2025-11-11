import ApiClient from './api-client';
import { DashboardData } from '@/app/types/dashboardTypes';

/**
 * Parameters for fetching dashboard data
 */
export interface DashboardParams {
  month: string; // YYYY-MM format
  includeResult?: boolean;
}

/**
 * Dashboard Service - handles all dashboard-related API calls
 * Follows Single Responsibility Principle
 */
class DashboardService extends ApiClient {
  /**
   * Fetches dashboard data for a specific month
   * @param params - Dashboard parameters (month and includeResult flag)
   * @returns Promise with dashboard data
   */
  async getDashboard(params: DashboardParams): Promise<DashboardData> {
    return this.get<DashboardData>('/api/dashboard', {
      month: params.month,
      includeResult: params.includeResult ?? true,
    });
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();

