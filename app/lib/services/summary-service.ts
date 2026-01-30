// ============================================================================
// IMPORTS
// ============================================================================
// External
import { Decimal } from "@prisma/client/runtime/library";

// Internal - Types
import { TransactionType, Prisma } from "@/app/generated/prisma";

// Internal - Services
import { prisma } from "@/prisma/db";
import { getTransactionAggregationsByType } from "@/app/lib/db/query-helpers";
import {
  getTransactionTypeConfig,
  affectsSummary,
} from "./transaction-type-config";

// ============================================================================
// TYPES
// ============================================================================
type PrismaTransaction = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Helper para buscar balance do mês anterior
 * Big-O: O(1) - busca por índice único
 */
async function getPreviousMonthBalance(
  tx: PrismaTransaction | typeof prisma,
  userId: number,
  date: Date
): Promise<Decimal> {
  const prevMonthDate = new Date(
    date.getFullYear(),
    date.getMonth() - 1,
    1
  );

  const prevSummary = await tx.monthlySummary.findUnique({
    where: {
      userId_month_year: {
        userId,
        month_year: prevMonthDate,
      },
    },
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

  // OTIMIZAÇÃO: Use optimized query helper - single GROUP BY query
  const dateRange = {
    gte: firstDayOfMonth,
    lte: lastDayOfMonth,
  };
  
  const aggregations = await getTransactionAggregationsByType(userId, dateRange);

  // OTIMIZAÇÃO: Get values from aggregation map (O(1) lookup)
  const total_income = aggregations.get(TransactionType.INCOME) ?? new Decimal(0);
  const needs_expenses = aggregations.get(TransactionType.NEEDS) ?? new Decimal(0);
  const wants_expenses = aggregations.get(TransactionType.WANTS) ?? new Decimal(0);
  const total_savings = aggregations.get(TransactionType.RESERVES) ?? new Decimal(0);
  const total_investments = aggregations.get(TransactionType.INVESTMENTS) ?? new Decimal(0);
  
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
  const startingBalance = await getPreviousMonthBalance(prisma, userId, monthDate);
  
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

/**
 * Versão da função que aceita transação do Prisma para operações atômicas
 * Usa o cliente de transação passado em vez do prisma global
 */
export async function updateMonthlySummaryIncrementalWithTx(
  tx: PrismaTransaction,
  userId: number,
  monthDate: Date,
  transactionDelta: {
    type: TransactionType;
    oldAmount?: Decimal;
    newAmount?: Decimal;
  }
) {
  const firstDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  
  // Busca o summary atual (ou cria se não existir)
  const currentSummary = await tx.monthlySummary.findUnique({
    where: {
      userId_month_year: {
        userId,
        month_year: firstDayOfMonth,
      }
    }
  });

  // Se não existe, recalcula tudo (primeira vez)
  if (!currentSummary) {
    // Para transações, precisamos calcular o summary completo
    // Isso é mais complexo, então vamos criar um summary básico
    const prevMonthDate = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1);
    const previousSummary = await tx.monthlySummary.findUnique({
      where: {
        userId_month_year: {
          userId,
          month_year: prevMonthDate,
        }
      }
    });

    const starting_balance = previousSummary ? previousSummary.final_balance : new Decimal(0);
    
    // Inicializa valores zerados
    const summaryData = {
      userId: userId,
      month_year: firstDayOfMonth,
      total_income: new Decimal(0),
      needs_expenses: new Decimal(0),
      wants_expenses: new Decimal(0),
      total_savings: new Decimal(0),
      total_investments: new Decimal(0),
      final_balance: starting_balance,
    };

    await tx.monthlySummary.create({ data: summaryData });
    
    // Agora atualiza com o delta
    return updateMonthlySummaryIncrementalWithTx(tx, userId, monthDate, transactionDelta);
  }

  // Verifica se o tipo afeta o summary
  if (!affectsSummary(transactionDelta.type)) {
    return currentSummary;
  }

  const config = getTransactionTypeConfig(transactionDelta.type);
  
  if (!config.summaryField) {
    return currentSummary;
  }

  // Calcula a diferença
  let delta = new Decimal(0);
  if (transactionDelta.oldAmount) {
    delta = delta.sub(transactionDelta.oldAmount);
  }
  if (transactionDelta.newAmount) {
    delta = delta.add(transactionDelta.newAmount);
  }

  if (delta.isZero()) {
    return currentSummary;
  }

  // Atualiza o campo correspondente
  const currentValue = currentSummary[config.summaryField] as Decimal;
  const updateData: Partial<typeof currentSummary> = {
    [config.summaryField]: currentValue.add(delta),
  };

  // Recalcula final_balance usando helper
  const startingBalance = await getPreviousMonthBalance(tx, userId, monthDate);
  
  const totalIncome = (updateData.total_income ?? currentSummary.total_income) as Decimal;
  
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

  return await tx.monthlySummary.update({
    where: {
      userId_month_year: {
        userId,
        month_year: firstDayOfMonth,
      }
    },
    data: updateData,
  });
}