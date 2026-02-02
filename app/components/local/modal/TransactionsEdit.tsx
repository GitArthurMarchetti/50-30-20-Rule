"use client";

// ============================================================================
// IMPORTS
// ============================================================================
// External
import { useEffect, useState, FormEvent } from "react";

// Internal - Types
import { TransactionType } from "@/app/generated/prisma";

// Internal - Services
import { categoryService, Category } from "@/app/lib/client/category-service";
import { transactionService } from "@/app/lib/client/transaction-service";
import { ApiError } from "@/app/lib/client/api-client";

// Internal - Context
import { useDashboard } from "@/app/context/DashboardContex";

// Internal - Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ============================================================================
// TYPES
// ============================================================================
interface TransactionData {
  id: number;
  description: string;
  amount: number | string;
  date: string | Date;
  type: TransactionType;
  categoryId: number | null;
}

interface TransactionFormData extends Omit<TransactionData, "categoryId"> {
  categoryId: number | string | null;
}

interface EditModalProps {
  transaction: TransactionData;
  isOpen: boolean;
  onClose: () => void;
  onTransactionUpdated: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function TransactionEditModal({
  transaction,
  isOpen,
  onClose,
  onTransactionUpdated,
}: EditModalProps) {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------
  const { setUpdatingTransaction } = useDashboard();
  const [formData, setFormData] = useState<TransactionFormData>({
    ...transaction,
    categoryId: transaction.categoryId ?? null,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      // Initialize form data
      setFormData({
        ...transaction,
        date: new Date(transaction.date).toISOString().split("T")[0],
        amount: String(transaction.amount),
        categoryId: transaction.categoryId ?? null,
      });
      setError("");
      setIsCategoriesLoading(true);

      // Fetch categories for this transaction type
      categoryService
        .getAll(transaction.type)
        .then((data) => {
          setCategories(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          // WHY: Silently handle category fetch failures - empty categories are valid
          // Errors are handled through error state for server errors (500+)
          setCategories([]);
          // Don't set error state for empty categories - it's valid to have no categories
          if (err instanceof ApiError && err.statusCode >= 500) {
            setError(err.message || "Failed to load categories");
          }
        })
        .finally(() => {
          setIsCategoriesLoading(false);
        });
    }
  }, [isOpen, transaction]);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      // For categoryId, keep it as string in form state, convert to number/null on submit
      if (name === "categoryId") {
        return {
          ...prev,
          [name]: value === "" ? null : value,
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setUpdatingTransaction(transaction.id, true);
    setError("");

    try {
      // Parse and validate amount
      const numericAmount = parseFloat(
        String(formData.amount).replace(",", ".")
      );
      if (numericAmount < 0) {
        setError("Value cannot be negative.");
        setIsLoading(false);
        setUpdatingTransaction(transaction.id, false);
        return;
      }

      // Convert categoryId from string (form) to number (API) or null
      const categoryId = formData.categoryId
        ? typeof formData.categoryId === "number"
          ? formData.categoryId
          : parseInt(String(formData.categoryId), 10)
        : null;

      // Validate categoryId is a valid number if provided
      if (categoryId !== null && (isNaN(categoryId) || categoryId <= 0)) {
        setError("Invalid category selected");
        setIsLoading(false);
        setUpdatingTransaction(transaction.id, false);
        return;
      }

      // Update transaction
      await transactionService.update(transaction.id, {
        description: formData.description,
        amount: numericAmount,
        type: transaction.type,
        categoryId: categoryId,
        date: new Date(formData.date + "T00:00:00"),
      });

      await onTransactionUpdated();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Ocorreu um erro desconhecido.";
      setError(message);
    } finally {
            setIsLoading(false);
            setUpdatingTransaction(transaction.id, false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Transaction: {formData.description}</DialogTitle>
                    <DialogDescription>
                        Update the transaction details below.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Name
                        </label>
                        <input
                            type="text"
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md  bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="amount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Value
                        </label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Prevent negative values
                              if (value === '' || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
                                handleChange(e);
                              }
                            }}
                            onKeyDown={(e) => {
                              // Prevent minus sign, negative numbers
                              if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                                e.preventDefault();
                              }
                            }}
                            className="flex h-10 w-full rounded-md  bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="0,00"
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Date
                        </label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date as string}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md  bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="categoryId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Category
                        </label>
                        <select
                            name="categoryId"
                            id="categoryId"
                            value={formData.categoryId ? String(formData.categoryId) : ""}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md  bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isCategoriesLoading}
                            required={false}
                        >
                            <option value="">{isCategoriesLoading ? 'Loading categories...' : 'No Category'}</option>
                            {Array.isArray(categories) && categories.length > 0 ? (
                                categories.map((cat) => (
                                    <option key={cat.id} value={String(cat.id)}>
                                        {cat.name}
                                    </option>
                                ))
                            ) : !isCategoriesLoading ? (
                                <option value="" disabled>
                                    No categories available
                                </option>
                            ) : null}
                        </select>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <DialogFooter>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 items-center justify-center rounded-md  bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                        >
                            {isLoading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
