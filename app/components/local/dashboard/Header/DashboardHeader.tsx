import AnnualLink from "./AnnualLink";
import UserWelcome from "./UserWelcome";

interface DashboardHeaderProps {
  lastMonthsResult: number;
  selectedDate: Date;
}

export default function DashboardHeader({
  lastMonthsResult,
  selectedDate,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-row justify-between items-center h-12 w-full  my-auto">
      <UserWelcome
        lastMonthsResult={lastMonthsResult}
      />

      <div className="flex flex-wrap items-center gap-4">
        <AnnualLink selectedDate={selectedDate} />
      </div>

    </header>
  );
}

