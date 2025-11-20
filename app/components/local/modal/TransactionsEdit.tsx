'use client';

import { TransactionType } from "@/app/generated/prisma";
import { useEffect, useState, FormEvent } from "react";
import { categoryService, Category } from "@/app/lib/client/category-service";
import { transactionService } from "@/app/lib/client/transaction-service";
import { ApiError } from "@/app/lib/client/api-client";
import { useDashboard } from "@/app/context/DashboardContex";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// 1. Definimos os dados que este modal espera
interface TransactionData {
    id: number;
    description: string;
    amount: number | string; // Vem como número, mas o input usa string
    date: string | Date;
    type: TransactionType; // TransactionType: INCOME, WANTS, NEEDS, RESERVES, INVESTMENTS
    categoryId: number | null; // Category ID: references a Category like "Groceries", "Salary"
}

// Form data type - categoryId can be string in form state
interface TransactionFormData extends Omit<TransactionData, 'categoryId'> {
    categoryId: number | string | null; // Allow string for form handling
}

interface EditModalProps {
    transaction: TransactionData;
    isOpen: boolean;
    onClose: () => void;
    onTransactionUpdated: () => void; // Para recarregar os dados
}

export default function TransactionEditModal({
    transaction,
    isOpen,
    onClose,
    onTransactionUpdated,
}: EditModalProps) {
    const { setUpdatingTransaction } = useDashboard();
    const [formData, setFormData] = useState<TransactionFormData>({ 
        ...transaction,
        categoryId: transaction.categoryId ?? null
    });
    const [categories, setCategories] = useState<Category[]>([]);
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(false); // Estado de loading
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            // Initialize form data - convert categoryId to string for form handling
            setFormData({
                ...transaction,
                date: new Date(transaction.date).toISOString().split('T')[0],
                amount: String(transaction.amount),
                // Keep categoryId as is (number or null), but we'll convert to string in the select
                categoryId: transaction.categoryId ?? null
            });
            setError("");
            setIsCategoriesLoading(true); 

            // Ensure transaction.type is properly serialized
            const typeString = String(transaction.type);
            console.log("Fetching categories for type:", typeString, transaction.type);

            categoryService.getAll(transaction.type)
                .then((data) => {
                    console.log("Categories loaded:", data);
                    setCategories(Array.isArray(data) ? data : []);
                })
                .catch((err) => {
                    console.error("Failed to fetch categories", err);
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            // For categoryId, keep it as string in form state, convert to number/null on submit
            if (name === 'categoryId') {
                return {
                    ...prev,
                    [name]: value === '' ? null : value, // Store as string or null
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
            const numericAmount = parseFloat(String(formData.amount).replace(',', '.'));
            if (numericAmount < 0) {
                setError("Value cannot be negative.");
                setIsLoading(false);
                setUpdatingTransaction(transaction.id, false);
                return;
            }
            // Convert categoryId from string (form) to number (API) or null
            const categoryId = formData.categoryId 
                ? (typeof formData.categoryId === 'number' 
                    ? formData.categoryId 
                    : parseInt(String(formData.categoryId), 10))
                : null;
            
            // Validate categoryId is a valid number if provided
            if (categoryId !== null && (isNaN(categoryId) || categoryId <= 0)) {
                setError("Invalid category selected");
                setIsLoading(false);
                setUpdatingTransaction(transaction.id, false);
                return;
            }

            await transactionService.update(transaction.id, {
                description: formData.description,
                amount: numericAmount,
                type: transaction.type, // TransactionType: INCOME, WANTS, NEEDS, etc.
                categoryId: categoryId, // Category ID: number referencing a category like "Groceries", "Salary"
                date: new Date(formData.date + 'T00:00:00'),
            });

            await onTransactionUpdated();
        } catch (err) {
            const message = err instanceof ApiError
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
