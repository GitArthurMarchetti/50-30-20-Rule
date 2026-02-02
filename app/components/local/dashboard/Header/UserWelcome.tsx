import { formatCurrency } from "@/app/lib/formatters";
import { FaUserCircle } from "react-icons/fa";

interface UserWelcomeProps {
    lastMonthsResult: number;
}

import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"
import { UserSheet } from "../UserSheetContent";

export default function UserWelcome({
    lastMonthsResult,
}: UserWelcomeProps) {

    const formattedResult = formatCurrency(lastMonthsResult)

    return (
        <div className="flex flex-row items-center h-full gap-4">
            <Sheet>
                <SheetTrigger className="h-full w-auto cursor-pointer transition-opacity hover:opacity-80">
                    <FaUserCircle className="h-full w-auto simple-button-style" />
                </SheetTrigger>

                <SheetContent side="left" className="border-none bg-secondary-background">
                    <UserSheet />
                </SheetContent>
            </Sheet>

            <div className="card-transaction flex items-center gap-2 px-4 py-2">
                <span className="text-sm secondary-text">
                    Last month&apos;s result:
                </span>
                <span className="font-bold text-income">
                    {formattedResult}
                </span>
            </div>
        </div>
    );
}

