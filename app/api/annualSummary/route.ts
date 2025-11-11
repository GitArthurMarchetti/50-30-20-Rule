import { getAnnualSummary } from "@/app/lib/annualSumarry-service";

import { SessionUser } from "@/app/lib/auth-server";
import { AuthenticatedHandler, RouteContext, withAuth } from "@/app/lib/auth-helpers";
import { badRequestResponse, internalErrorResponse } from "@/app/lib/errors/responses";
import { NextRequest, NextResponse } from "next/server";
import { isValidYear } from "@/app/lib/validators";

const getHandler: AuthenticatedHandler<Record<string, never>> = async (
    request: NextRequest,
    context: RouteContext<Record<string, never>>,
    session: SessionUser
) => {
    try {
        const { searchParams } = new URL(request.url);
        const yearParam = searchParams.get("year");

        const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

        if (!isValidYear(year)) {
            return badRequestResponse("Invalid year. Year must be between 1900 and 2100");
        }

        const summary = await getAnnualSummary(session.userId, year);

        return NextResponse.json(summary);
    } catch (error) {
        console.error("Error fetching annual summary:", error);
        return internalErrorResponse("Failed to fetch annual summary");
    }
};

export const GET = withAuth(getHandler);