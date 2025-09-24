import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

interface FinancialCategoryCardProps {
    title: string;
    percentage: string;
    amount: string;
    children: React.ReactNode;
}

export default function FinancialCategoryCard({
    title,
    percentage,
    amount,
    children,
}: FinancialCategoryCardProps) {
    return (
        // O container principal continua sendo uma coluna flexível
        <div className="secondary-background flex flex-col h-full w-full rounded-lg overflow-hidden">

            {/* 1. Header Card - Altura baseada no conteúdo */}
            {/* 'flex-shrink-0' impede que ele encolha se o conteúdo for grande */}
            <div className="pt-5 pb-5 flex justify-center items-center flex-shrink-0">
                <h1 className="font-bold text-lg">{title}</h1>
            </div>

            {/* 2. Scroll Area - Cresce para ocupar o espaço livre */}
            {/* 'flex-grow' é a classe chave aqui. Ela faz este elemento se expandir. */}
            <div className="flex-grow">
                <ScrollArea className="h-full w-full">
                    <div className="p-2"> {/* Adicionado padding para o conteúdo não colar nas bordas */}
                        {children}
                    </div>
                </ScrollArea>
            </div>


            {/* 3. Rodapé - Também tem altura baseada no conteúdo */}
            <div className="bg-green-500 flex flex-col flex-shrink-0">
                {/* % */}
                <div className="w-full h-1/2 flex justify-center items-center p-1">
                    <p className="text-black font-bold">{percentage}</p>
                </div>
                {/* $ */}
                <div className="w-full h-1/2 flex justify-center items-center p-1">
                    <p className="text-black font-bold">{amount}</p>
                </div>
            </div>
        </div>
    );
}