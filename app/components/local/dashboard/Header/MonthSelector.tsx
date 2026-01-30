'use client';

import { useMemo, useCallback, memo } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import dynamic from "next/dynamic";

// OTIMIZAÇÃO: Lazy load YearSelector
const YearSelector = dynamic(() => import("./YearSelector"), {
    ssr: true,
});

interface MonthSelectorProps {
    selectedDate: Date;
    onMonthChange: (monthIndex: number) => void;
    onYearChange: (year: number) => void;
}

// OTIMIZAÇÃO: Mover array para fora do componente (evita recriação)
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
] as const;

// OTIMIZAÇÃO: Memoizar componente
const MonthSelector = memo(function MonthSelector({ selectedDate, onMonthChange, onYearChange }: MonthSelectorProps) {
    // OTIMIZAÇÃO: Memoizar valores computados
    const handleMonthChange = useCallback((monthIndexAsString: string) => {
        const monthIndex = parseInt(monthIndexAsString, 10);
        onMonthChange(monthIndex);
    }, [onMonthChange]);

    const currentMonthValue = useMemo(() => String(selectedDate.getMonth()), [selectedDate]);

    return (
        <header className="flex h-20 w-auto items-center justify-end p-4 gap-2">
            <YearSelector
                selectedDate={selectedDate}
                onYearChange={onYearChange}
            />
            <Select value={currentMonthValue} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[180px] border-none     transaction-background cursor-pointer">
                    <SelectValue placeholder="Select a month" />
                </SelectTrigger>
                <SelectContent >
                    {MONTHS.map((month, index) => (
                        <SelectItem
                            key={month}
                            value={String(index)}
                        >
                            {month}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </header>
    );
});

MonthSelector.displayName = 'MonthSelector';

export default MonthSelector;
