"use client";

import { useState, FormEvent, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { TransactionType } from "@/app/generated/prisma";
import { categoryService, Category } from "@/app/lib/client/category-service";
import { transactionService } from "@/app/lib/client/transaction-service";
import { ApiError } from "@/app/lib/client/api-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AddTransactionButtonProps {
  categoryType: TransactionType;
  onTransactionAdded: () => void;
  selectedDate: Date;
}

export default function AddTransactionButton({ categoryType, onTransactionAdded, selectedDate }: AddTransactionButtonProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(selectedDate.toISOString().split('T')[0]);
  
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(1); 
    setDate(newDate.toISOString().split('T')[0]);
  }, [selectedDate]); 

  useEffect(() => {
    if (open) {
      setDescription("");
      setAmount("");
      setCategoryId("");
      setError("");
      setIsCategoriesLoading(true); 
      
      const newDate = new Date(selectedDate);
      newDate.setDate(1); 
      setDate(newDate.toISOString().split('T')[0]);

      // Ensure categoryType is properly serialized as a string
      const typeString = String(categoryType);
      console.log("Fetching categories for type:", typeString, categoryType);
      
      categoryService.getAll(categoryType)
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
  }, [open, selectedDate, categoryType]); 

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description || !amount) {
      setError("Name and Value are necessary.");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const numericAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(numericAmount)) {
        setError("Invalid Value.");
        setIsLoading(false);
        return;
      }
      if (numericAmount < 0) {
        setError("Value cannot be negative.");
        setIsLoading(false);
        return;
      }
      
      // Convert categoryId from string (form) to number (API) or null
      const finalCategoryId = categoryId && categoryId !== '' 
        ? parseInt(categoryId, 10) 
        : null;
      
      // Validate categoryId is a valid number if provided
      if (finalCategoryId !== null && (isNaN(finalCategoryId) || finalCategoryId <= 0)) {
        setError("Invalid category selected");
        setIsLoading(false);
        return;
      }

      await transactionService.create({
        description,
        amount: numericAmount,
        date: new Date(date + 'T00:00:00'),
        type: categoryType, // TransactionType: INCOME, WANTS, NEEDS, RESERVES, INVESTMENTS
        categoryId: finalCategoryId, // Category ID: number referencing a category like "Groceries", "Salary"
      });
      
      setOpen(false);
      onTransactionAdded();
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : err instanceof Error
        ? err.message
        : "An unknown error occurred.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="simple-button-style">
          <PlusCircle size={20} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-none">
        <DialogHeader>
          <DialogTitle>New Transaction in <span className="capitalize">{categoryType.toLowerCase()}</span></DialogTitle>
          <DialogDescription>
            Add a new transaction to your {categoryType.toLowerCase()} category.
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              value={amount}
              onChange={(e) => {
                const value = e.target.value;
                // Prevent negative values
                if (value === '' || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
                  setAmount(value);
                }
              }}
              onKeyDown={(e) => {
                // Prevent minus sign, negative numbers
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              value={categoryId}
              onChange={(e) => {
                console.log("Category selected:", e.target.value);
                setCategoryId(e.target.value);
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              onClick={() => setOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
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
