import React from "react";

interface DashboardLayoutProps {
    children: React.ReactNode;
    sidebar: React.ReactNode;
}

export default function DashboardLayout({ children, sidebar }: DashboardLayoutProps) {
    return (
        <div className="h-full w-full flex flex-row">
            <main className="h-full w-10/12 px-6 pb-10 flex flex-col"> 
                {children}
            </main>

            <aside className="h-full w-2/12 secondary-background px-3 pb-10">
                {sidebar}
            </aside>
        </div>
    );
}