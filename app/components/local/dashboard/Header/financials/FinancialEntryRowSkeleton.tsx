import { Skeleton } from "@/components/ui/skeleton";

export default function FinancialEntryRowSkeleton() {
  return (
    <div className="flex justify-between items-center p-2 mb-2 text-sm card-transaction rounded">
      <div className="h-full flex flex-col gap-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}

