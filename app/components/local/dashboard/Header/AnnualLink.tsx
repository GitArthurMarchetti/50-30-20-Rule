'use client'; // Necessário para o useRouter

import { useRouter } from "next/navigation";
import { FaBookOpen } from "react-icons/fa";

// 1. Defina as props que o componente receberá
interface AnnualLinkProps {
  selectedDate: Date;
}

export default function AnnualLink({ selectedDate }: AnnualLinkProps) {
  const router = useRouter();

  const handleLink = () => {
    // 2. Obtenha o ano da data recebida
    const year = selectedDate.getFullYear();

    // 3. Passe o ano como um query parameter na URL
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