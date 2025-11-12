import ApiClient from './api-client';
import { TransactionType } from '@/app/generated/prisma';

/**
 * Category model from API
 */
export interface Category {
  id: number;
  name: string;
  type: TransactionType;
}

/**
 * Request payload for creating a category
 */
export interface CreateCategoryRequest {
  name: string;
  type: TransactionType;
}

/**
 * Request payload for updating a category
 */
export interface UpdateCategoryRequest {
  name?: string;
  type?: TransactionType;
}

/**
 * Category Service - handles all category-related API calls
 * Follows Single Responsibility Principle
 */
class CategoryService extends ApiClient {
  /**
   * Fetches all categories, optionally filtered by type
   * @param type - Optional transaction type filter
   * @returns Promise with array of categories
   */
  async getAll(type?: TransactionType): Promise<Category[]> {
    return this.get<Category[]>('/api/categories', type ? { type } : undefined);
  }

  /**
   * Fetches a single category by ID
   * @param id - Category ID
   * @returns Promise with category
   */
  async getById(id: number): Promise<Category> {
    return this.get<Category>(`/api/categories/${id}`);
  }

  /**
   * Creates a new category
   * @param data - Category data
   * @returns Promise with created category
   */
  async create(data: CreateCategoryRequest): Promise<Category> {
    return this.post<Category>('/api/categories', data);
  }

  /**
   * Updates an existing category
   * @param id - Category ID
   * @param data - Partial category data to update
   * @returns Promise with updated category
   */
  async update(id: number, data: UpdateCategoryRequest): Promise<Category> {
    return this.put<Category>(`/api/categories/${id}`, data);
  }

  /**
   * Deletes a category
   * @param id - Category ID
   * @returns Promise
   */
  async deleteCategory(id: number): Promise<void> {
    return this.delete(`/api/categories/${id}`);
  }

  /**
   * Initializes default categories for the current user
   * @returns Promise with initialization result
   */
  async initializeDefaultCategories(): Promise<{ message: string; categoriesCreated: number; existingCategories: number }> {
    return this.post<{ message: string; categoriesCreated: number; existingCategories: number }>('/api/categories/initialize', {});
  }
}

// Export singleton instance
export const categoryService = new CategoryService();

