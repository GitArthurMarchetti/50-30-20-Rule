'use client';

import { useEffect, useState } from "react";

interface AnnualSummaryData {
    year: number;
    total_income: string; 
    needs_expenses: string;
    wants_expenses: string;
    total_savings: string;
    total_investments: string;
    final_balance: string;
}

export default function AnnualSummary() {
    const [summary, setSummary] = useState<AnnualSummaryData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedYear] = useState(new Date().getFullYear());
    
    useEffect(() => {
        const fetchAnnualSummary = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/annualSummary?year=${selectedYear}`);
                if (response.ok) {
                    const data = await response.json();
                    setSummary(data);
                } else {
                    console.error("Failed to fetch annual summary");
                    setSummary(null);
                }
            } catch (error) {
                console.error("Error fetching summary:", error);
                setSummary(null);
            }
            setIsLoading(false);
        };

        fetchAnnualSummary();
    }, [selectedYear]); 


    if (isLoading) {
        return <div>Carregando resumo anual...</div>;
    }

    if (!summary) {
        return <div>Não foi possível carregar o resumo para {selectedYear}.</div>;
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