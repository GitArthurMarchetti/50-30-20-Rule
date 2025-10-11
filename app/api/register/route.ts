import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";
import bcrypt from "bcryptjs";
import { Prisma } from "@/app/generated/prisma";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    const usernameNorm = String(username ?? "").trim();
    const emailNorm = String(email ?? "").trim().toLowerCase();
    const pass = String(password ?? "");

    if (!username || String(username).trim().length === 0) {
      return NextResponse.json({ message: "Username is required" }, { status: 400 });
    }
    
    if (!email || String(email).trim().length === 0) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }
    
    if (!password || String(password).length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: emailNorm }, { username: usernameNorm }] },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json({ message: "Email or username already exists" }, { status: 409 });
    }

    const hash = await bcrypt.hash(pass, 10);

    await prisma.user.create({
      data: {
        username: usernameNorm,
        email: emailNorm,
        password_hash: hash,
      },
    });

    return NextResponse.json({ message: "User created" }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ message: "Email/username already registered" }, { status: 409 });
    }
    const msg = e instanceof Error ? e.message : "Internal error";
    console.error(msg);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
