import { SessionUser } from "@/app/lib/auth-server";
import { AuthenticatedHandler, RouteContext, withAuth } from "@/app/lib/auth-helpers";
import { getOrCreateMonthlySummary } from "@/app/lib/summary-service";
import { NextRequest, NextResponse } from "next/server";
import { internalErrorResponse } from "@/app/lib/errors/responses";

const postHandler: AuthenticatedHandler<Record<string, never>> = async (
  request: NextRequest,
  context: RouteContext<Record<string, never>>,
  session: SessionUser
) => {
  try {
    const summary = await getOrCreateMonthlySummary(session.userId, new Date());

    return NextResponse.json({
      message: "Monthly summary updated successfully.",
      summary,
    });
  } catch (error) {
    console.error("Error creating/updating monthly summary:", error);
    return internalErrorResponse("Failed to update monthly summary");
  }
};

export const POST = withAuth(postHandler);