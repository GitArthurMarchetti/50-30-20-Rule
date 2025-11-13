'use client';

import { useEffect, useState } from "react";
import { annualSummaryService, AnnualSummaryData } from "@/app/lib/client/annual-summary-service";
import { ApiError } from "@/app/lib/client/api-client";

export default function AnnualSummary() {
    const [summary, setSummary] = useState<AnnualSummaryData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear] = useState(new Date().getFullYear());
    
    useEffect(() => {
        const fetchAnnualSummary = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await annualSummaryService.getAnnualSummary({ year: selectedYear });
                setSummary(data);
            } catch (err) {
                const message = err instanceof ApiError
                    ? err.message
                    : err instanceof Error
                    ? err.message
                    : "Failed to fetch annual summary";
                setError(message);
                console.error("Error fetching summary:", err);
                setSummary(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnnualSummary();
    }, [selectedYear]); 


    if (isLoading) {
        return <div>Carregando resumo anual...</div>;
    }

    if (error || !summary) {
        return <div>Não foi possível carregar o resumo para {selectedYear}. {error && <span className="text-red-500">{error}</span>}</div>;
    }

    return (
        <div>
            <h1>Resumo Anual de {summary.year}</h1>

            <p>Receita Total: {summary.total_income}</p>
            <p>Despesas (Necessidades): {summary.needs_expenses}</p>
            <p>Despesas (Desejos): {summary.wants_expenses}</p>
            <p>Reservas: {summary.total_savings}</p>
            <p>Investimentos: {summary.total_investments}</p>
            <p>Balanço Final: {summary.final_balance}</p>

        </div>
    );
}