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
    <button className="flex flex-row items-center   card-transaction   m-12"
      onClick={handleLink}  
    >
      <p className="mr-3">
        Annual Database
      </p>
      <FaBookOpen className="h-7 w-auto" />
    </button>
  );
}