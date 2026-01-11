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
        <div className="flex flex-row items-center h-full">

            <Sheet>

                <SheetTrigger className="h-full w-auto cursor-pointer">
                    <FaUserCircle className="h-full w-auto  simple-button-style" />
                </SheetTrigger>

                <SheetContent side="left" className="border-none">
                    <UserSheet />
                </SheetContent>
            </Sheet>

            <div className="card-transaction ml-5 flex items-center">
                <p className="mr-2">
                    Last month&apos;s result:
                </p>
                <p className="font-bold text-green-300">
                    {formattedResult}
                </p>
            </div>
        </div>
    );
}

