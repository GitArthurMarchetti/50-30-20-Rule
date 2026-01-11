'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface YearSelectorProps {
    selectedDate: Date;
    onYearChange: (year: number) => void;
}

export default function YearSelector({ selectedDate, onYearChange }: YearSelectorProps) {
    const currentYear = selectedDate.getFullYear();
    const currentYearValue = String(currentYear);
    
    // Generate years from 5 years ago to 5 years in the future
    const startYear = currentYear - 5;
    const endYear = currentYear + 5;
    const years: number[] = [];
    for (let year = startYear; year <= endYear; year++) {
        years.push(year);
    }

    const handleYearChange = (yearAsString: string) => {
        const year = parseInt(yearAsString, 10);
        onYearChange(year);
    };

    return (
        <Select value={currentYearValue} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[180px] border-none transaction-background cursor-pointer">
                <SelectValue placeholder="Select a year" />
            </SelectTrigger>
            <SelectContent>
                {years.map((year) => (
                    <SelectItem
                        key={year}
                        value={String(year)}
                    >
                        {year}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

