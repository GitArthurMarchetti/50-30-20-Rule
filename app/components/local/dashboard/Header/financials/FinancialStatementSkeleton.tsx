import { Skeleton } from "@/components/ui/skeleton";

export default function FinancialStatementSkeleton() {
  return (
    <section className="h-4/9 w-full mb-auto flex flex-col gap-4 mt-5">
      <div className="h-1/6 flex justify-center">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="h-4/6 flex flex-col justify-evenly gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-sm" />
        ))}
      </div>
      <div className="h-1/6 flex justify-center">
        <Skeleton className="h-12 w-full rounded-sm" />
      </div>
    </section>
  );
}

