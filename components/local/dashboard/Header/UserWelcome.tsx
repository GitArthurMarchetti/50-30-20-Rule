import { FaUserCircle } from "react-icons/fa";
import { VscEye } from "react-icons/vsc";

export default function UserWelcome() {
    return (
        <div className="flex flex-row items-center h-full">
            <FaUserCircle className="h-full w-auto" />

            <div className="card-transaction ml-10 flex items-center">
                <VscEye className="h-5 w-5 mr-2" />
                <p className="mr-2">
                    Last month&apos;s result:
                </p>
                <p className="text-green-300 font-bold">
                    $100
                </p>
            </div>
        </div>
    );
}