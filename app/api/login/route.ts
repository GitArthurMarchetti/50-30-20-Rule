import { prisma } from "@/prisma/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signJwt } from "@/app/lib/jwt";


export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();


    const emailNorm = String(email || "").trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (!user) {
      return NextResponse.json({ message: "Credenciais inválidas" }, { status: 401 });
    }

    const ok = await bcrypt.compare(String(password || ""), user.password_hash);
    if (!ok) {
      return NextResponse.json({ message: "Credenciais inválidas" }, { status: 401 });
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
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}
