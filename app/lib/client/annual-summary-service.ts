import ApiClient from './api-client';

/**
 * Annual summary data structure
 */
export interface AnnualSummaryData {
  year: number;
  total_income: string;
  needs_expenses: string;
  wants_expenses: string;
  total_savings: string;
  total_investments: string;
  final_balance: string;
}

/**
 * Parameters for fetching annual summary
 */
export interface AnnualSummaryParams {
  year: number;
}

/**
 * Annual Summary Service - handles annual summary API calls
 * Follows Single Responsibility Principle
 */
class AnnualSummaryService extends ApiClient {
  /**
   * Fetches annual summary for a specific year
   * @param params - Year parameter
   * @returns Promise with annual summary data
   */
  async getAnnualSummary(params: AnnualSummaryParams): Promise<AnnualSummaryData> {
    return this.get<AnnualSummaryData>('/api/annualSummary', {
      year: params.year,
    });
  }
}

// Export singleton instance
export const annualSummaryService = new AnnualSummaryService();

