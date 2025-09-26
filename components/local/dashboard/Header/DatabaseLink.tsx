import { FaBookOpen } from "react-icons/fa";

export default function DatabaseLink() {
  return (
    <div className="flex flex-row items-center h-full card-transaction !p-7">
      <p className="mr-3">
        Annual Database
      </p>
      <FaBookOpen className="h-7 w-auto" />
    </div>
  );
}