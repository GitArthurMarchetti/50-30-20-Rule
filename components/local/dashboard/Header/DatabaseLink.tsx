import { FaBookOpen } from "react-icons/fa";

export default function DatabaseLink() {
  return (
    <div className="flex flex-row items-center h-full cursor-pointer">
      <p className="mr-3">
        Annual Database
      </p>
      <FaBookOpen className="h-5/6 w-auto" />
    </div>
  );
}