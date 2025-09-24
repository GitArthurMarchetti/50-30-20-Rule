import UserWelcome from "./UserWelcome";
import DatabaseLink from "./DatabaseLink";

export default function DashboardHeader() {
  return (
    <header className="flex flex-row justify-between items-center h-20 w-full pt-5 pb-5">
      <UserWelcome />
      <DatabaseLink />
    </header>
  );
}