'use client';

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function AnnualSummary() {
    const router = useRouter();

    const handleGoBack = () => {
        router.back();
    };

    return (
        <div className="relative min-h-screen">
            {/* Botão no canto superior esquerdo */}
            <div className="absolute top-8 left-8">
                <button 
                    onClick={handleGoBack}
                    className="flex flex-row items-center gap-2 card-transaction px-4 py-2 hover:scale-[1.02] transition-all duration-200"
                    aria-label="Go back"
                >
                    <ArrowLeft className="h-5 w-5 text-foreground/80" />
                    <span className="text-sm font-medium text-foreground">
                        Back
                    </span>
                </button>
            </div>

            {/* Conteúdo centralizado */}
            <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
                <div className="max-w-2xl space-y-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Under Development
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground mb-6">
                        Arthur is working on this...
                    </p>
                    <p className="text-base md:text-lg text-foreground">
                        For now,
                            visit his {' '}
                            <a 
                            href="https://www.linkedin.com/in/arthur-marchetti" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-income font-bold hover:text-income/80 underline transition-colors"
                        >
                            LinkedIn
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
