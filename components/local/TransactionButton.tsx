"use client";

import { useState, FormEvent } from "react";
// Remova 'useRouter' pois não vamos mais usá-lo aqui
import { PlusCircle } from "lucide-react";
import { TransactionType } from "@/app/generated/prisma";

interface AddTransactionButtonProps {
  categoryType: TransactionType;
  // 1. Adicionamos uma nova prop: uma função que será chamada quando a transação for criada com sucesso.
  onTransactionAdded: () => void;
}

export default function AddTransactionButton({ categoryType, onTransactionAdded }: AddTransactionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description || !amount) {
      setError("Descrição e valor são obrigatórios.");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const numericAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(numericAmount)) {
        setError("O valor inserido não é um número válido.");
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/transactions/[id]', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          amount: numericAmount,
          date: new Date(date),
          type: categoryType,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao criar a transação.");
      }
      
      // Sucesso!
      setIsOpen(false);
      
      // 2. EM VEZ DE router.refresh(), CHAMAMOS A FUNÇÃO DE AVISO
      onTransactionAdded();
      
      // Limpa o formulário
      setDescription("");
      setAmount("");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* O resto do seu componente JSX permanece exatamente o mesmo */}
      <button onClick={() => setIsOpen(true)} className="text-gray-400 hover:text-white transition-colors">
        <PlusCircle size={20} />
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
           {/* ... todo o seu formulário ... */}
           <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nova Transação em <span className="capitalize">{categoryType.toLowerCase()}</span></h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium mb-1">Descrição</label>
                <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="mb-4">
                <label htmlFor="amount" className="block text-sm font-medium mb-1">Valor</label>
                <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0,00" step="0.01" required />
              </div>
              <div className="mb-4">
                <label htmlFor="date" className="block text-sm font-medium mb-1">Data</label>
                <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
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

