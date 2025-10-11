import { getSessionUser } from "@/app/lib/auth-server";
import { getOrCreateMonthlySummary } from "@/app/lib/summary-service";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const summary = await getOrCreateMonthlySummary(session.userId, new Date());

    return NextResponse.json({
      message: "Monthly summary updated successfully.",
      summary,
    });
  } catch (error) {
    console.error("Error updating summary:", error);
    return NextResponse.json(
      { message: "Internal error" },
      { status: 500 }
    );
  }
}