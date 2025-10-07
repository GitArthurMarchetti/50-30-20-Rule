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

    if (!usernameNorm || !emailNorm || pass.length < 6) {
      return NextResponse.json(
        { message: "Dados inválidos (senha mínimo 6 caracteres)" },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: emailNorm }, { username: usernameNorm }] },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json({ message: "Email ou username já existe" }, { status: 409 });
    }

    const hash = await bcrypt.hash(pass, 10);

    await prisma.user.create({
      data: {
        username: usernameNorm,
        email: emailNorm,
        password_hash: hash,
      },
    });

    return NextResponse.json({ message: "Usuário criado" }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ message: "Email/username já cadastrado" }, { status: 409 });
    }
    const msg = e instanceof Error ? e.message : "Erro interno";
    console.error(msg);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}
