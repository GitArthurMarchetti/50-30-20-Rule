'use client';

import { TransactionType } from "@/app/generated/prisma";
import { useEffect, useState, FormEvent } from "react";
import { categoryService, Category } from "@/app/lib/api/category-service";
import { transactionService } from "@/app/lib/api/transaction-service";
import { ApiError } from "@/app/lib/api/api-client";

// 1. Definimos os dados que este modal espera
interface TransactionData {
    id: number;
    description: string;
    amount: number | string; // Vem como número, mas o input usa string
    date: string | Date;
    type: TransactionType;
    categoryId: number | null;
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

    const [formData, setFormData] = useState({ ...transaction });
    const [categories, setCategories] = useState<Category[]>([]);
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(false); // Estado de loading
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setFormData({
                ...transaction,
                date: new Date(transaction.date).toISOString().split('T')[0],
                amount: String(transaction.amount) 
            });
            setError("");
            setIsCategoriesLoading(true); 

            categoryService.getAll(transaction.type)
                .then((data) => {
                    setCategories(data);
                })
                .catch((err) => {
                    console.error("Failed to fetch categories", err);
                    setCategories([]);
                    setError(err instanceof ApiError ? err.message : "Failed to load categories");
                })
                .finally(() => {
                    setIsCategoriesLoading(false); 
                });
        }
    }, [isOpen, transaction]); 

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const numericAmount = parseFloat(String(formData.amount).replace(',', '.'));
            const categoryId = formData.categoryId ? parseInt(String(formData.categoryId), 10) : null;

            await transactionService.update(transaction.id, {
                description: formData.description,
                amount: numericAmount,
                type: transaction.type,
                categoryId: categoryId,
                date: new Date(formData.date + 'T00:00:00'),
            });

            onTransactionUpdated();
        } catch (err) {
            const message = err instanceof ApiError
                ? err.message
                : err instanceof Error
                ? err.message
                : "Ocorreu um erro desconhecido.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit Transaction: {formData.description}</h2>
                <form onSubmit={handleSubmit}>
                    {/* ... campos de description, amount, date ... */}
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium mb-1">Nome</label>
                        <input
                            type="text"
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="amount" className="block text-sm font-medium mb-1">Value</label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0,00"
                            step="0.01"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="date" className="block text-sm font-medium mb-1">Date</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date as string}
                            onChange={handleChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Select de Categoria */}
                    <div className="mb-4">
                        <label htmlFor="categoryId" className="block text-sm font-medium mb-1">Category</label>
                        <select
                            name="categoryId"
                            id="categoryId"
                            value={formData.categoryId || ""}
                            onChange={handleChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isCategoriesLoading} // Desabilitado enquanto carrega
                        >
                            <option value="">{isCategoriesLoading ? 'Loading...' : 'No Category'}</option>
                            {Array.isArray(categories) && categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Cancelar</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 disabled:bg-gray-400">{isLoading ? 'Salvando...' : 'Salvar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
