import { prisma } from "@/prisma/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signJwt } from "@/app/lib/jwt";
import { unauthorizedResponse, internalErrorResponse, badRequestResponse } from "@/app/lib/errors/responses";
import { safeParseJson, isValidEmail } from "@/app/lib/validators";
import { logSuccess, logError } from "@/app/lib/logger";


export async function POST(req: Request) {
  let emailNorm: string | undefined;
  
  try {
    const parseResult = await safeParseJson<{ email?: string; password?: string }>(req);
    if (!parseResult.success) {
      return badRequestResponse(parseResult.error || "Invalid request body");
    }

    const { email, password } = parseResult.data!;

    if (!email || !password) {
      return badRequestResponse("Email and password are required");
    }

    emailNorm = String(email).trim().toLowerCase();
    const passwordString = String(password);

    // SECURITY: Validate email format before querying database
    // Prevents unnecessary database queries and potential timing attacks
    if (!isValidEmail(emailNorm)) {
      return badRequestResponse("Invalid email format");
    }

    const user = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (!user) {
      return unauthorizedResponse("Invalid credentials");
    }

    const ok = await bcrypt.compare(passwordString, user.password_hash);
    if (!ok) {
      return unauthorizedResponse("Invalid credentials");
    }

    const token = await signJwt({ userId: user.id, email: user.email }, "2h");

    const res = NextResponse.json({ message: "ok" });
    res.cookies.set({
      name: "sessionToken",
      value: token,
      httpOnly: true,
      sameSite: "lax", 
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 2,
    });

    logSuccess("User logged in successfully", { userId: user.id, email: emailNorm });
    return res;
  } catch (e) {
    logError("Login failed", e, { email: emailNorm });
    return internalErrorResponse("Internal error");
  }
}
