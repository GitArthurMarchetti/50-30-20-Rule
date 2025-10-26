"use client";

import { useState, FormEvent, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { TransactionType, Category } from "@/app/generated/prisma";

interface AddTransactionButtonProps {
  categoryType: TransactionType;
  onTransactionAdded: () => void;
  selectedDate: Date;
}

export default function AddTransactionButton({ categoryType, onTransactionAdded, selectedDate }: AddTransactionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    if (isOpen) {
      setDescription("");
      setAmount("");
      setCategoryId("");
      setError("");
      setIsCategoriesLoading(true); 
      
      const newDate = new Date(selectedDate);
      newDate.setDate(1); 
      setDate(newDate.toISOString().split('T')[0]);

      fetch(`/api/categories?type=${categoryType}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error("Falha ao buscar categorias. Status: " + res.status);
            }
            return res.json();
          })
          .then((data) => {
            if (Array.isArray(data)) {
              setCategories(data);
            } else {
              console.error("API não retornou um array de categorias:", data);
              setCategories([]);
            }
          })
          .catch((err) => {
            console.error("Failed to fetch categories", err);
            setCategories([]);
          })
          .finally(() => {
            setIsCategoriesLoading(false); 
          });
    }
  }, [isOpen, selectedDate, categoryType]); 

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
      
      const finalCategoryId = categoryId ? parseInt(categoryId, 10) : null;

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          amount: numericAmount,
          date: new Date(date + 'T00:00:00'),
          type: categoryType,
          categoryId: finalCategoryId, 
        }),
      });

      if (!response.ok) {
        throw new Error("Error to create.");
      }
      
      setIsOpen(false);
      onTransactionAdded();


    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => {
    setIsOpen(true);
  }

  return (
    <>
      <button onClick={openModal} className="text-gray-400 hover:text-white transition-colors">
        <PlusCircle size={20} />
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
           <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New Transaction in <span className="capitalize">{categoryType.toLowerCase()}</span></h2>
            <form onSubmit={handleSubmit}>


              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium mb-1">Name</label>
                <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="mb-4">
                <label htmlFor="amount" className="block text-sm font-medium mb-1">Value</label>
                <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0,00" step="0.01" required />
              </div>
              <div className="mb-4">
                <label htmlFor="date" className="block text-sm font-medium mb-1">Date</label>
                <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>

              <div className="mb-4">
                <label htmlFor="categoryId" className="block text-sm font-medium mb-1">Category</label>
                <select
                    name="categoryId"
                    id="categoryId"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCategoriesLoading} 
                >
                    <option value="">{isCategoriesLoading ? 'Carregando...' : 'No Category'}</option>
                    
                    {Array.isArray(categories) && categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
              </div>

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Cancelar</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 disabled:bg-gray-400">{isLoading ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
