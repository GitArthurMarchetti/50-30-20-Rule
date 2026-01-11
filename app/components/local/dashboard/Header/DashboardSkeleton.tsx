import { Skeleton } from "@/components/ui/skeleton";
import FinancialEntryRowSkeleton from "./financials/FinancialEntryRowSkeleton";

export default function DashboardSkeleton() {
  return (
    <>
      {/* Header skeleton */}
      <header className="flex flex-row justify-between items-center h-12 w-full my-auto">
        {/* UserWelcome skeleton */}
        <div className="flex flex-row items-center h-full">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="card-transaction ml-5 flex items-center gap-2 px-3 py-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* AnnualLink skeleton */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="card-transaction flex flex-row items-center gap-2 px-3 py-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-7" />
          </div>
        </div>
      </header>

      {/* Main categories skeleton */}
      <section className="h-8/9 w-full mt-auto flex flex-row justify-evenly gap-4">
        {/* 3 main categories: Income, Needs, Wants */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-1/5 h-full">
            <div className="secondary-background flex flex-col h-full w-full rounded-lg overflow-hidden">
              {/* Header */}
              <div className="pt-5 pb-5 flex items-center flex-shrink-0 w-full">
                <div className="w-10 flex justify-start pl-2">
                  <Skeleton className="h-6 w-6 rounded" />
                </div>
                <h1 className="title flex-1 text-center">
                  <Skeleton className="h-6 w-24 mx-auto" />
                </h1>
                <div className="w-10 flex justify-end pr-2">
                  <Skeleton className="h-6 w-6 rounded" />
                </div>
              </div>

              {/* Content area with scroll */}
              <div className="flex-grow min-h-0">
                <div className="p-2">
                  {[1, 2, 3, 4].map((j) => (
                    <FinancialEntryRowSkeleton key={j} />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t flex flex-col flex-shrink-0 p-2">
                <div className="w-full flex flex-row justify-center items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="w-full flex flex-row justify-center items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Split categories: Reserves and Investments */}
        <div className="w-1/5 h-full flex flex-col justify-between">
          {[1, 2].map((i) => (
            <div key={i} className="h-[48%] w-full">
              <div className="secondary-background flex flex-col h-full w-full rounded-lg overflow-hidden">
                {/* Header */}
                <div className="pt-5 pb-5 flex items-center flex-shrink-0 w-full">
                  <div className="w-10 flex justify-start pl-2">
                    <Skeleton className="h-6 w-6 rounded" />
                  </div>
                  <h1 className="title flex-1 text-center">
                    <Skeleton className="h-6 w-20 mx-auto" />
                  </h1>
                  <div className="w-10 flex justify-end pr-2">
                    <Skeleton className="h-6 w-6 rounded" />
                  </div>
                </div>

                {/* Content area with scroll */}
                <div className="flex-grow min-h-0">
                  <div className="p-2">
                    {[1, 2].map((j) => (
                      <FinancialEntryRowSkeleton key={j} />
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t flex flex-col flex-shrink-0 p-2">
                  <div className="w-full flex flex-row justify-center items-center gap-2 mb-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="w-full flex flex-row justify-center items-center gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
