import { formatCurrency } from "@/app/lib/formatters";
import { FaUserCircle } from "react-icons/fa";
import { VscEye, VscEyeClosed } from "react-icons/vsc"; 

interface UserWelcomeProps {
    lastMonthsResult: number;
    isResultIncluded: boolean;
    onToggleResult: () => void;
}

export default function UserWelcome({
    lastMonthsResult,
    isResultIncluded,
    onToggleResult,
}: UserWelcomeProps) {

    const formattedResult = formatCurrency(lastMonthsResult)

    return (
        <div className="flex flex-row items-center h-full">
            <FaUserCircle className="h-full w-auto" />

            <div className="card-transaction ml-5 flex items-center"  onClick={onToggleResult}>
                <button
                    className="mr-2 focus:outline-none"
                    aria-label="Ativar/desativar resultado do mês anterior"
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

