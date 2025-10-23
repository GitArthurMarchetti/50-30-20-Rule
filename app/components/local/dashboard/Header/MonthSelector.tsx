'use client';


import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface MonthSelectorProps {
    selectedDate: Date;
    onMonthChange: (monthIndex: number) => void;
}

export default function MonthSelector({ selectedDate, onMonthChange }: MonthSelectorProps) {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const handleMonthChange = (monthIndexAsString: string) => {
        const monthIndex = parseInt(monthIndexAsString, 10);
        onMonthChange(monthIndex);
    };

    const currentMonthValue = String(selectedDate.getMonth());

    return (
        <header className="flex h-20 w-auto items-center justify-end p-4">
            <Select value={currentMonthValue} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[180px] border-none     transaction-background cursor-pointer">
                    <SelectValue placeholder="Select a month" />
                </SelectTrigger>
                <SelectContent >
                    {months.map((month, index) => (
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
}
