'use client';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { FaAngleDown } from "react-icons/fa";


interface MonthSelectorProps {
    selectedDate: Date;
    onMonthChange: (monthIndex: number) => void;
}

export default function MonthSelector({ selectedDate, onMonthChange }: MonthSelectorProps) {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentMonthName = months[selectedDate.getMonth()];

    return (
        <header className="flex h-20 w-auto items-center justify-end p-4">
            <DropdownMenu>
                <DropdownMenuTrigger className="flex flex-row items-center justify-center rounded-md  bg-transparent px-4 py-2 text-sm font-medium ">
                    {currentMonthName} <FaAngleDown className="ml-2 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-25 rounded-md border bg-white p-1 text-black shadow-md">
                    {months.map((month, index) => (
                        <DropdownMenuItem
                            key={month}
                            onSelect={() => onMonthChange(index)}
                            className="cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none"
                        >
                            {month}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
