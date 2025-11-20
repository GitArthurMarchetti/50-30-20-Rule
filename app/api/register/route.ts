import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";
import bcrypt from "bcryptjs";
import { Prisma } from "@/app/generated/prisma";
import { badRequestResponse, conflictResponse, internalErrorResponse } from "@/app/lib/errors/responses";
import { safeParseJson, isValidEmail } from "@/app/lib/validators";
import { initializeDefaultCategories } from "@/app/lib/category-helpers";
import { logSuccess, logError } from "@/app/lib/logger";

export async function POST(req: Request) {
  let emailNorm: string | undefined;
  
  try {
    const parseResult = await safeParseJson<{ username?: string; email?: string; password?: string }>(req);
    if (!parseResult.success) {
      return badRequestResponse(parseResult.error || "Invalid request body");
    }

    const { username, email, password } = parseResult.data!;

    const usernameNorm = String(username ?? "").trim();
    emailNorm = String(email ?? "").trim().toLowerCase();
    const pass = String(password ?? "");

    if (!username || usernameNorm.length === 0) {
      return badRequestResponse("Username is required");
    }

    if (usernameNorm.length > 50) {
      return badRequestResponse("Username cannot exceed 50 characters");
    }
    
    if (!email || emailNorm.length === 0) {
      return badRequestResponse("Email is required");
    }

    if (!isValidEmail(emailNorm)) {
      return badRequestResponse("Invalid email format");
    }
    
    if (!password || pass.length < 6) {
      return badRequestResponse("Password must be at least 6 characters long");
    }

    if (pass.length > 128) {
      return badRequestResponse("Password cannot exceed 128 characters");
    }

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: emailNorm }, { username: usernameNorm }] },
      select: { id: true },
    });
    if (exists) {
      return conflictResponse("Email or username already exists");
    }

    const hash = await bcrypt.hash(pass, 10);

    const newUser = await prisma.user.create({
      data: {
        username: usernameNorm,
        email: emailNorm,
        password_hash: hash,
      },
    });

    // Initialize default categories for the new user
    try {
      const categoriesCreated = await initializeDefaultCategories(newUser.id);
      logSuccess(`Default categories initialized for new user`, { userId: newUser.id, categoriesCount: categoriesCreated });
    } catch (error) {
      // Log error but don't fail user registration if categories can't be created
      logError("Failed to initialize default categories for new user", error, { userId: newUser.id });
    }

    logSuccess("User registered successfully", { userId: newUser.id, email: emailNorm });
    return NextResponse.json({ message: "User created" }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return conflictResponse("Email/username already registered");
    }
    logError("User registration failed", e, { email: emailNorm });
    return internalErrorResponse("Internal error");
  }
}
