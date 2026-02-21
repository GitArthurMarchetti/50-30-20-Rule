'use client'; // Required for useRouter

import { useRouter } from "next/navigation";
import { FaBookOpen } from "react-icons/fa";

// 1. Define the props that the component will receive
interface AnnualLinkProps {
  selectedDate: Date;
}

export default function AnnualLink({ selectedDate }: AnnualLinkProps) {
  const router = useRouter();

  const handleLink = () => {
    // 2. Get the year from the received date
    const year = selectedDate.getFullYear();

    // 3. Pass the year as a query parameter in the URL
    router.push(`/AnnualSummary?year=${year}`);
  }
  
  return (
    <button 
      className="flex flex-row items-center gap-3 card-transaction px-4 py-2 hover:scale-[1.02] transition-all duration-200"
      onClick={handleLink}
      aria-label="View annual summary"
    >
      <span className="text-sm font-medium text-foreground">
        Annual Database
      </span>
      <FaBookOpen className="h-5 w-5 text-foreground/80" />
    </button>
  );
}