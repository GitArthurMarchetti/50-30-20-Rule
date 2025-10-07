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

    // Obtém o nome do mês a partir da data selecionada
    const currentMonthName = months[selectedDate.getMonth()];

    return (
        <header className="flex flex-row h-20 w-auto">
            <DropdownMenu>
                <DropdownMenuTrigger className="ml-auto flex flex-row items-center mt-auto mb-auto focus:outline-none">
                    {currentMonthName} <FaAngleDown className="ml-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Months</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {months.map((month, index) => (
                        // 2. Ao clicar, chama a função onMonthChange com o índice do mês
                        <DropdownMenuItem key={month} onSelect={() => onMonthChange(index)}>
                            {month}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
