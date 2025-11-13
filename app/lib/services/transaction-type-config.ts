import { TransactionType } from "@/app/generated/prisma";

/**
 * Nome dos campos do MonthlySummary que podem ser afetados por transações
 */
type SummaryFieldName = 
  | 'total_income' 
  | 'needs_expenses' 
  | 'wants_expenses' 
  | 'total_savings' 
  | 'total_investments';

/**
 * Configuração de como cada TransactionType afeta o MonthlySummary
 */
type TransactionTypeConfig = {
  summaryField: SummaryFieldName | null; // null = não afeta summary (ex: ROLLOVER)
  isIncome: boolean; // true = soma ao balance, false = subtrai do balance
  affectsBalance: boolean; // se afeta o cálculo do final_balance
};

/**
 * Configuração centralizada do mapeamento TransactionType → Summary Field
 * 
 * ESTRUTURA DE DADOS: Record<TransactionType, TransactionTypeConfig>
 * - Performance: O(1) lookup - acesso direto por chave
 * - Type Safety: TypeScript valida que TODOS os tipos do enum estão presentes
 * - Escalável: Adicionar novo tipo = apenas uma linha neste objeto
 * - Imutável: 'as const' previne mutações acidentais
 * - Compile-time checks: Se faltar um tipo, TypeScript ERRA em compile-time
 */
export const TRANSACTION_TYPE_CONFIG = {
  [TransactionType.INCOME]: {
    summaryField: 'total_income' as const,
    isIncome: true,
    affectsBalance: true,
  },
  [TransactionType.NEEDS]: {
    summaryField: 'needs_expenses' as const,
    isIncome: false,
    affectsBalance: true,
  },
  [TransactionType.WANTS]: {
    summaryField: 'wants_expenses' as const,
    isIncome: false,
    affectsBalance: true,
  },
  [TransactionType.RESERVES]: {
    summaryField: 'total_savings' as const,
    isIncome: false,
    affectsBalance: true,
  },
  [TransactionType.INVESTMENTS]: {
    summaryField: 'total_investments' as const,
    isIncome: false,
    affectsBalance: true,
  },
  [TransactionType.ROLLOVER]: {
    summaryField: null,
    isIncome: false,
    affectsBalance: false,
  },
} as const satisfies Record<TransactionType, TransactionTypeConfig>;

/**
 * Helper para buscar configuração de um tipo
 * Big-O: O(1) - acesso direto ao Record
 * 
 * @param type - Tipo da transação
 * @returns Configuração do tipo
 */
export function getTransactionTypeConfig(type: TransactionType): TransactionTypeConfig {
  return TRANSACTION_TYPE_CONFIG[type];
}

/**
 * Helper para verificar se tipo afeta summary
 * Big-O: O(1)
 * 
 * @param type - Tipo da transação
 * @returns true se o tipo afeta o summary, false caso contrário
 */
export function affectsSummary(type: TransactionType): boolean {
  return TRANSACTION_TYPE_CONFIG[type].summaryField !== null;
}

/**
 * Helper para obter o nome do campo do summary para um tipo
 * Big-O: O(1)
 * 
 * @param type - Tipo da transação
 * @returns Nome do campo ou null se não afeta summary
 */
export function getSummaryFieldName(type: TransactionType): SummaryFieldName | null {
  return TRANSACTION_TYPE_CONFIG[type].summaryField;
}

