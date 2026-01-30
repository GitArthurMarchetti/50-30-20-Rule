import { prisma } from "@/prisma/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signJwt } from "@/app/lib/jwt";
import { unauthorizedResponse, internalErrorResponse, badRequestResponse, tooManyRequestsResponse } from "@/app/lib/errors/responses";
import { safeParseJson, isValidEmail } from "@/app/lib/validators";
import { logSuccess, logError } from "@/app/lib/logger";
import { checkRateLimit, getClientIdentifier } from "@/app/lib/rate-limiter";
import { validateContentType } from "@/app/lib/security/content-type-validator";
import { handleCorsPreflight, addCorsHeaders } from "@/app/lib/security/cors";
import { NextRequest } from "next/server";


export async function POST(req: NextRequest) {
  let emailNorm: string | undefined;
  
  try {
    // Handle CORS preflight
    const corsResponse = handleCorsPreflight(req);
    if (corsResponse) {
      return corsResponse;
    }

    // Validate Content-Type
    const contentTypeValidation = validateContentType(req);
    if (!contentTypeValidation.valid) {
      return badRequestResponse(contentTypeValidation.error || "Invalid Content-Type");
    }
    // Rate limiting - 5 attempts per 15 minutes per IP
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(`login:${clientId}`, {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    });

    if (!rateLimit.allowed) {
      return tooManyRequestsResponse(
        `Too many login attempts. Please try again after ${Math.ceil((rateLimit.resetTime - Date.now()) / 60000)} minutes.`
      );
    }

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

    // Additional rate limiting per email (brute force protection)
    const emailRateLimit = checkRateLimit(`login:email:${emailNorm}`, {
      maxRequests: 3,
      windowMs: 15 * 60 * 1000, // 15 minutes
    });

    if (!emailRateLimit.allowed) {
      return tooManyRequestsResponse(
        `Too many login attempts for this email. Please try again after ${Math.ceil((emailRateLimit.resetTime - Date.now()) / 60000)} minutes.`
      );
    }

    const user = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (!user) {
      // Use same timing for invalid credentials to prevent user enumeration
      await bcrypt.compare(passwordString, "$2a$10$dummyhashfordummycomparison"); // Dummy comparison
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
    return addCorsHeaders(res, req);
  } catch (e) {
    logError("Login failed", e, { email: emailNorm });
    return internalErrorResponse("Internal error");
  }
}
