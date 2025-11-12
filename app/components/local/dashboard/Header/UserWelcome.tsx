import { formatCurrency } from "@/app/lib/formatters";
import { FaUserCircle } from "react-icons/fa";
import { VscEye, VscEyeClosed } from "react-icons/vsc";

interface UserWelcomeProps {
    lastMonthsResult: number;
    isResultIncluded: boolean;
    onToggleResult: () => void;
}

import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"
import { UserSheet } from "../UserSheetContent";

export default function UserWelcome({
    lastMonthsResult,
    isResultIncluded,
    onToggleResult,
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

            <div className="card-transaction ml-5 flex items-center" onClick={onToggleResult}>
                <button
                    className="mr-2 focus:outline-none"
                    aria-label="Enable/disable previous month's result"
                >
                    {isResultIncluded ? <VscEye className="h-5 w-5" /> : <VscEyeClosed className="h-5 w-5" />}
                </button>
                <p className="mr-2">
                    Last month&apos;s result:
                </p>
                <p className={`font-bold transition-colors ${isResultIncluded ? 'text-green-300' : 'text-gray-500 line-through'}`}>
                    {formattedResult}
                </p>
            </div>
        </div>
    );
}

