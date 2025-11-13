import { TransactionType } from "@/app/generated/prisma";
import { prisma } from "@/prisma/db";
import { Decimal } from "@prisma/client/runtime/library";
import { 
  getTransactionTypeConfig, 
  affectsSummary 
} from "./transaction-type-config";

/**
 * Helper para buscar balance do mês anterior
 * Big-O: O(1) - busca por índice único
 */
async function getPreviousMonthBalance(userId: number, date: Date): Promise<Decimal> {
  const prevMonthDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const prevSummary = await prisma.monthlySummary.findUnique({
    where: {
      userId_month_year: {
        userId,
        month_year: prevMonthDate,
      }
    }
  });
  return prevSummary?.final_balance ?? new Decimal(0);
}

/**
 * Recalcula o summary completo de um mês (usado para primeira vez ou recálculo manual)
 * Big-O: O(n) onde n = número de transações do mês
 * 
 * OTIMIZAÇÃO: Usa agregação SQL via Prisma para melhor performance
 * 
 * @param userId - ID do usuário
 * @param dateForMonth - Data do mês a calcular
 * @returns Summary do mês
 */
export async function getOrCreateMonthlySummary(userId: number, dateForMonth: Date) {
  const prevMonthDate = new Date(dateForMonth.getFullYear(), dateForMonth.getMonth() - 1, 1);
  const firstDayOfPrevMonth = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1);

  const previousSummary = await prisma.monthlySummary.findUnique({
    where: {
      userId_month_year: {
        userId: userId,
        month_year: firstDayOfPrevMonth,
      }
    }
  });

  const starting_balance = previousSummary ? previousSummary.final_balance : new Decimal(0);

  const firstDayOfMonth = new Date(dateForMonth.getFullYear(), dateForMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(dateForMonth.getFullYear(), dateForMonth.getMonth() + 1, 0, 23, 59, 59);

  // OTIMIZAÇÃO: Usa agregação SQL em vez de buscar todas as transações
  // Isso reduz a quantidade de dados transferidos e processa no banco
  const [incomeResult, needsResult, wantsResult, reservesResult, investmentsResult] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId: userId,
        date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
        type: TransactionType.INCOME,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: userId,
        date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
        type: TransactionType.NEEDS,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: userId,
        date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
        type: TransactionType.WANTS,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: userId,
        date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
        type: TransactionType.RESERVES,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: userId,
        date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
        type: TransactionType.INVESTMENTS,
      },
      _sum: { amount: true },
    }),
  ]);

  // Usa configuração centralizada para mapear tipos
  const total_income = new Decimal(incomeResult._sum.amount ?? 0);
  const needs_expenses = new Decimal(needsResult._sum.amount ?? 0);
  const wants_expenses = new Decimal(wantsResult._sum.amount ?? 0);
  const total_savings = new Decimal(reservesResult._sum.amount ?? 0);
  const total_investments = new Decimal(investmentsResult._sum.amount ?? 0);
  
  const final_balance = starting_balance  
    .add(total_income)         
    .sub(needs_expenses)        
    .sub(wants_expenses)
    .sub(total_savings)         
    .sub(total_investments);  

  const summaryData = {
    userId: userId,
    month_year: firstDayOfMonth,
    total_income,
    needs_expenses,
    wants_expenses,
    total_savings,
    total_investments,
    final_balance,
  };

  const summary = await prisma.monthlySummary.upsert({
    where: {
      userId_month_year: {
        userId: userId,
        month_year: firstDayOfMonth,
      }
    },
    update: summaryData, 
    create: summaryData, 
  });

  return summary;
}

/**
 * Atualiza o summary de forma incremental quando uma transação muda
 * 
 * OTIMIZAÇÃO: O(1) - apenas atualiza o campo específico em vez de recalcular tudo
 * 
 * @param userId - ID do usuário
 * @param monthDate - Data do mês a atualizar
 * @param transactionDelta - Diferença da transação (oldAmount para remover, newAmount para adicionar)
 * @returns Summary atualizado
 */
export async function updateMonthlySummaryIncremental(
  userId: number,
  monthDate: Date,
  transactionDelta: {
    type: TransactionType;
    oldAmount?: Decimal; // undefined se for criação
    newAmount?: Decimal; // undefined se for deleção
  }
) {
  const firstDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  
  // Busca o summary atual (ou cria se não existir)
  const currentSummary = await prisma.monthlySummary.findUnique({
    where: {
      userId_month_year: {
        userId,
        month_year: firstDayOfMonth,
      }
    }
  });

  // Se não existe, recalcula tudo (primeira vez)
  if (!currentSummary) {
    return await getOrCreateMonthlySummary(userId, monthDate);
  }

  // Verifica se o tipo afeta o summary usando configuração centralizada
  if (!affectsSummary(transactionDelta.type)) {
    // Tipo não afeta summary (ex: ROLLOVER)
    return currentSummary;
  }

  // Obtém configuração do tipo - O(1) lookup no Record
  const config = getTransactionTypeConfig(transactionDelta.type);
  
  if (!config.summaryField) {
    return currentSummary;
  }

  // Calcula a diferença
  let delta = new Decimal(0);
  if (transactionDelta.oldAmount) {
    delta = delta.sub(transactionDelta.oldAmount); // Remove valor antigo
  }
  if (transactionDelta.newAmount) {
    delta = delta.add(transactionDelta.newAmount); // Adiciona valor novo
  }

  // Se não há mudança, retorna sem atualizar
  if (delta.isZero()) {
    return currentSummary;
  }

  // Atualiza o campo correspondente dinamicamente usando configuração
  const currentValue = currentSummary[config.summaryField] as Decimal;
  const updateData: Partial<typeof currentSummary> = {
    [config.summaryField]: currentValue.add(delta),
  };

  // Recalcula final_balance de forma genérica usando configuração
  const startingBalance = await getPreviousMonthBalance(userId, monthDate);
  
  // Soma todas as receitas
  const totalIncome = (updateData.total_income ?? currentSummary.total_income) as Decimal;
  
  // Subtrai todas as despesas usando configuração para identificar quais são despesas
  const expenseFields: Array<keyof typeof currentSummary> = [
    'needs_expenses',
    'wants_expenses', 
    'total_savings',
    'total_investments'
  ];
  
  let totalExpenses = new Decimal(0);
  for (const field of expenseFields) {
    const value = (updateData[field] ?? currentSummary[field]) as Decimal;
    totalExpenses = totalExpenses.add(value);
  }

  updateData.final_balance = startingBalance
    .add(totalIncome)
    .sub(totalExpenses);

  return await prisma.monthlySummary.update({
    where: {
      userId_month_year: {
        userId,
        month_year: firstDayOfMonth,
      }
    },
    data: updateData,
  });
}