import { getSessionUser } from "@/app/lib/auth-server";
import { getOrCreateMonthlySummary } from "@/app/lib/summary-service";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const summary = await getOrCreateMonthlySummary(session.userId, new Date());

    return NextResponse.json({
      message: "Resumo mensal atualizado com sucesso.",
      summary,
    });
  } catch (error) {
    console.error("Erro ao atualizar resumo:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}