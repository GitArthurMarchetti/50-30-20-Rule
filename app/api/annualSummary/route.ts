import { getAnnualSummary } from "@/app/lib/annualSumarry-service";
import { getSessionUser } from "@/app/lib/auth-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const yearParam = searchParams.get("year");

        const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

        if (isNaN(year)) {
            return NextResponse.json({ message: "Invalid year format" }, { status: 400 });
        }

        const summary = await getAnnualSummary(session.userId, year);

        return NextResponse.json(summary);

    } catch (error) {
        console.error("Error fetching annual summary:", error);
        return NextResponse.json(
            { message: "Internal error" },
            { status: 500 }
        );
    }
}