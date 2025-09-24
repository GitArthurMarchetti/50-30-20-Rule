'use client'; // Necessário para interatividade do Dropdown

import { FaAngleDown } from "react-icons/fa";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MonthSelector() {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <header className="flex flex-row h-20 w-auto">
            <DropdownMenu>
                <DropdownMenuTrigger className="ml-auto flex flex-row items-center mt-auto mb-auto focus:outline-none">
                    January <FaAngleDown className="ml-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Months</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {months.map((month) => (
                        <DropdownMenuItem key={month}>{month}</DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}