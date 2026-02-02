import ApiClient from './api-client';
import { TransactionType } from '@/app/generated/prisma';
import { getCsrfToken } from './csrf-client';
import { ApiError } from './api-client';

/**
 * Pending Transaction model from API
 */
export interface PendingTransaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  categoryId: number | null;
  category: {
    id: number;
    name: string;
    type: TransactionType;
  } | null;
  expiresAt: string;
  isDuplicate: boolean | null;
  rawData: unknown;
}

/**
 * Request payload for updating a pending transaction
 */
export interface UpdatePendingTransactionRequest {
  description?: string;
  amount?: number;
  type?: TransactionType;
  date?: string | Date;
  categoryId?: number | null;
}

/**
 * Response from import file operation
 */
export interface ImportFileResponse {
  success: boolean;
  createdIds: number[];
  stats: {
    total: number;
    valid: number;
    created: number;
    duplicates: number;
    errors: number;
  };
  errors?: string[];
}

/**
 * Response from commit operation
 */
export interface CommitResponse {
  success: boolean;
  stats: {
    total: number;
    committed: number;
    failed: number;
  };
  results: Array<{
    id: number;
    success: boolean;
    transactionId?: number;
    error?: string;
  }>;
  errors?: Array<{
    id: number;
    error: string;
  }>;
}

/**
 * Response from batch commit operation
 */
export interface CommitBatchResponse {
  success: number;
  errors: string[];
}

/**
 * Pending Transaction Service - handles all pending transaction-related API calls
 * WHY: Centralizes all pending transaction API logic in one place for maintainability
 * Follows Single Responsibility Principle
 */
class PendingTransactionService extends ApiClient {
  /**
   * Imports a file and creates pending transactions
   * WHY: Creates pending transactions instead of real ones to allow user review before commit
   * This prevents accidental imports and maintains data quality
   * @param file - File to import (CSV or JSON)
   * @returns Promise with array of created pending transactions
   */
  async importFile(file: File): Promise<PendingTransaction[]> {
    try {
      // Get CSRF token
      const csrfToken = await getCsrfToken();
      if (!csrfToken) {
        throw new Error('CSRF token is empty');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Make request with FormData (don't set Content-Type header, browser will set it with boundary)
      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: {
          'x-csrf-token': csrfToken,
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(
          error.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      const importResult: ImportFileResponse = await response.json();

      // Fetch the created pending transactions
      if (importResult.createdIds && importResult.createdIds.length > 0) {
        const allPending = await this.getAll();
        // Filter to only return the newly created ones
        return allPending.filter((pendingTransaction) =>
          importResult.createdIds.includes(pendingTransaction.id)
        );
      }

      return [];
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error occurred',
        0
      );
    }
  }

  /**
   * Fetches all pending transactions for the current user
   * WHY: Allows users to review and edit imported transactions before committing
   * @returns Promise with array of pending transactions
   */
  async getAll(): Promise<PendingTransaction[]> {
    return this.get<PendingTransaction[]>('/api/pending-transactions');
  }

  /**
   * Updates a pending transaction
   * WHY: Enables users to correct errors in imported data before committing
   * Updates don't affect MonthlySummary until transaction is committed
   * @param id - Pending transaction ID
   * @param data - Partial pending transaction data to update
   * @returns Promise with updated pending transaction
   */
  async update(
    id: number,
    data: UpdatePendingTransactionRequest
  ): Promise<PendingTransaction> {
    const payload: Record<string, unknown> = {};

    if (data.description !== undefined) {
      payload.description = data.description;
    }

    if (data.amount !== undefined) {
      payload.amount = data.amount;
    }

    if (data.type !== undefined) {
      payload.type = data.type;
    }

    if (data.date !== undefined) {
      payload.date =
        typeof data.date === 'string'
          ? data.date
          : data.date.toISOString();
    }

    if (data.categoryId !== undefined) {
      payload.categoryId = data.categoryId ?? null;
    }

    return this.put<PendingTransaction>(
      `/api/pending-transactions/${id}`,
      payload
    );
  }

  /**
   * Commits a single pending transaction (converts it to a real transaction)
   * WHY: Atomic operation creates Transaction, updates MonthlySummary, and deletes PendingTransaction
   * Ensures data consistency - if any step fails, entire operation rolls back
   * @param id - Pending transaction ID
   * @returns Promise with commit response
   */
  async commit(id: number): Promise<CommitResponse> {
    return this.post<CommitResponse>(
      `/api/pending-transactions/${id}/commit`,
      {}
    );
  }

  /**
   * Deletes/rejects a pending transaction
   * WHY: Allows users to reject imported transactions they don't want
   * @param id - Pending transaction ID
   * @returns Promise
   */
  async reject(id: number): Promise<void> {
    return this.delete(`/api/pending-transactions/${id}`);
  }

  /**
   * Commits multiple pending transactions in batch
   * WHY: Allows bulk approval of imports - more efficient than individual commits
   * Processes transactions individually to allow partial success
   * @param ids - Array of pending transaction IDs
   * @returns Promise with commit batch response
   */
  async commitBatch(ids: number[]): Promise<CommitBatchResponse> {
    if (ids.length === 0) {
      throw new ApiError('No IDs provided for batch commit', 400);
    }

    if (ids.length === 1) {
      // Single commit - use commit method instead
      const response = await this.commit(ids[0]);
      return {
        success: response.stats?.committed || 0,
        errors: response.errors
          ? response.errors.map((e) => `ID ${e.id}: ${e.error}`)
          : [],
      };
    }

    // Batch commit: use first ID in path, send all IDs in body
    const response = await this.post<CommitResponse>(
      `/api/pending-transactions/${ids[0]}/commit`,
      { ids }
    );

    // Transform response to match CommitBatchResponse interface
    const successCount = response.stats?.committed || 0;
    const errors: string[] = [];

    if (response.errors && response.errors.length > 0) {
      response.errors.forEach((error) => {
        errors.push(`ID ${error.id}: ${error.error}`);
      });
    }

    // Also check results for failures
    if (response.results) {
      response.results.forEach((result) => {
        if (!result.success && result.error) {
          errors.push(`ID ${result.id}: ${result.error}`);
        }
      });
    }

    return {
      success: successCount,
      errors,
    };
  }
}

// Export singleton instance
export const pendingTransactionService = new PendingTransactionService();
