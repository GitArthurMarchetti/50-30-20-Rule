import ApiClient from './api-client';
import { TransactionType } from '@/app/generated/prisma';

/**
 * Request payload for creating a transaction
 */
export interface CreateTransactionRequest {
  description: string;
  amount: number;
  type: TransactionType;
  date: Date | string;
  categoryId?: number | null;
}

/**
 * Request payload for updating a transaction
 */
export interface UpdateTransactionRequest {
  description?: string;
  amount?: number;
  date?: Date | string;
  categoryId?: number | null;
}

/**
 * Transaction Service - handles all transaction-related API calls
 * Follows Single Responsibility Principle
 */
class TransactionService extends ApiClient {
  /**
   * Creates a new transaction
   * @param data - Transaction data
   * @returns Promise with created transaction
   */
  async create(data: CreateTransactionRequest) {
    return this.post('/api/transactions', {
      ...data,
      date: typeof data.date === 'string' 
        ? data.date 
        : data.date.toISOString(),
    });
  }

  /**
   * Updates an existing transaction
   * @param id - Transaction ID
   * @param data - Transaction data to update (all fields required by API)
   * @returns Promise with updated transaction
   */
  async update(id: number, data: UpdateTransactionRequest & { type: TransactionType }) {
    const payload: Record<string, unknown> = {
      description: data.description,
      amount: data.amount,
      type: data.type,
      date: typeof data.date === 'string' 
        ? data.date 
        : data.date?.toISOString(),
      categoryId: data.categoryId ?? null,
    };

    return this.put(`/api/transactions/${id}`, payload);
  }

  /**
   * Deletes a transaction
   * @param id - Transaction ID
   * @returns Promise
   */
  async deleteTransaction(id: number) {
    return this.delete(`/api/transactions/${id}`);
  }
}

// Export singleton instance
export const transactionService = new TransactionService();

