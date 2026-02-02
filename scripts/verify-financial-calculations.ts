#!/usr/bin/env tsx
/**
 * QA Verification Script: Financial Calculations & Edge Cases
 * 
 * This script verifies:
 * 1. MonthlySummary calculations are mathematically correct
 * 2. Data integrity between Transactions and MonthlySummary
 * 3. The 50/30/10/10 rule compliance (if applicable)
 * 4. Edge cases and potential bugs
 * 
 * Run with: npm run verify:calculations
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

const envPath = resolve(process.cwd(), '.env');
const envLocalPath = resolve(process.cwd(), '.env.local');

if (existsSync(envPath)) {
  config({ path: envPath });
}
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
}

import { prisma } from '../prisma/db';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionType } from '../app/generated/prisma';
import { getTransactionAggregationsByType } from '../app/lib/db/query-helpers';

// ============================================================================
// TYPES
// ============================================================================
interface VerificationResult {
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

interface MonthlySummaryCheck {
  summaryId: number;
  userId: number;
  monthYear: Date;
  issues: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================
const GOLD_RULE_PERCENTAGES = {
  NEEDS: 50,
  WANTS: 30,
  INVESTMENTS: 10,
  RESERVES: 10,
  TOTAL: 100,
} as const;

const TOLERANCE = 0.01; // Allow 1 cent tolerance for floating point errors

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function decimalEquals(a: Decimal, b: Decimal, tolerance: number = TOLERANCE): boolean {
  const diff = a.sub(b).abs();
  return diff.lessThanOrEqualTo(new Decimal(tolerance));
}

function decimalToNumber(d: Decimal): number {
  return d.toNumber();
}

function formatCurrency(amount: number | Decimal): string {
  const num = typeof amount === 'number' ? amount : amount.toNumber();
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

/**
 * Verifies that final_balance calculation is correct for a MonthlySummary
 */
async function verifyMonthlySummaryCalculation(
  summary: {
    id: number;
    userId: number;
    month_year: Date;
    total_income: Decimal;
    needs_expenses: Decimal;
    wants_expenses: Decimal;
    total_savings: Decimal;
    total_investments: Decimal;
    final_balance: Decimal;
  }
): Promise<VerificationResult> {
  // Get previous month's final_balance
  const prevMonthDate = new Date(
    summary.month_year.getFullYear(),
    summary.month_year.getMonth() - 1,
    1
  );

  const prevSummary = await prisma.monthlySummary.findUnique({
    where: {
      userId_month_year: {
        userId: summary.userId,
        month_year: prevMonthDate,
      },
    },
  });

  const startingBalance = prevSummary?.final_balance ?? new Decimal(0);

  // Calculate expected final_balance
  const expectedFinalBalance = startingBalance
    .add(summary.total_income)
    .sub(summary.needs_expenses)
    .sub(summary.wants_expenses)
    .sub(summary.total_savings)
    .sub(summary.total_investments);

  // Compare with actual
  if (!decimalEquals(summary.final_balance, expectedFinalBalance)) {
    return {
      passed: false,
      message: `❌ MonthlySummary #${summary.id} has incorrect final_balance calculation`,
      details: {
        summaryId: summary.id,
        userId: summary.userId,
        monthYear: summary.month_year.toISOString(),
        expected: formatCurrency(expectedFinalBalance),
        actual: formatCurrency(summary.final_balance),
        difference: formatCurrency(summary.final_balance.sub(expectedFinalBalance).abs()),
        startingBalance: formatCurrency(startingBalance),
        totalIncome: formatCurrency(summary.total_income),
        needsExpenses: formatCurrency(summary.needs_expenses),
        wantsExpenses: formatCurrency(summary.wants_expenses),
        totalSavings: formatCurrency(summary.total_savings),
        totalInvestments: formatCurrency(summary.total_investments),
      },
    };
  }

  return {
    passed: true,
    message: `✅ MonthlySummary #${summary.id} calculation is correct`,
  };
}

/**
 * Verifies that MonthlySummary aggregates match actual Transaction totals
 */
async function verifySummaryMatchesTransactions(
  summary: {
    id: number;
    userId: number;
    month_year: Date;
    total_income: Decimal;
    needs_expenses: Decimal;
    wants_expenses: Decimal;
    total_savings: Decimal;
    total_investments: Decimal;
  }
): Promise<VerificationResult> {
  const firstDayOfMonth = new Date(
    summary.month_year.getFullYear(),
    summary.month_year.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    summary.month_year.getFullYear(),
    summary.month_year.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  const dateRange = {
    gte: firstDayOfMonth,
    lte: lastDayOfMonth,
  };

  // Get actual transaction aggregates
  const aggregations = await getTransactionAggregationsByType(
    summary.userId,
    dateRange
  );

  const actualIncome = aggregations.get(TransactionType.INCOME) ?? new Decimal(0);
  const actualNeeds = aggregations.get(TransactionType.NEEDS) ?? new Decimal(0);
  const actualWants = aggregations.get(TransactionType.WANTS) ?? new Decimal(0);
  const actualReserves = aggregations.get(TransactionType.RESERVES) ?? new Decimal(0);
  const actualInvestments = aggregations.get(TransactionType.INVESTMENTS) ?? new Decimal(0);

  const issues: string[] = [];

  if (!decimalEquals(summary.total_income, actualIncome)) {
    issues.push(
      `Income mismatch: Summary=${formatCurrency(summary.total_income)}, Actual=${formatCurrency(actualIncome)}`
    );
  }

  if (!decimalEquals(summary.needs_expenses, actualNeeds)) {
    issues.push(
      `Needs mismatch: Summary=${formatCurrency(summary.needs_expenses)}, Actual=${formatCurrency(actualNeeds)}`
    );
  }

  if (!decimalEquals(summary.wants_expenses, actualWants)) {
    issues.push(
      `Wants mismatch: Summary=${formatCurrency(summary.wants_expenses)}, Actual=${formatCurrency(actualWants)}`
    );
  }

  if (!decimalEquals(summary.total_savings, actualReserves)) {
    issues.push(
      `Reserves mismatch: Summary=${formatCurrency(summary.total_savings)}, Actual=${formatCurrency(actualReserves)}`
    );
  }

  if (!decimalEquals(summary.total_investments, actualInvestments)) {
    issues.push(
      `Investments mismatch: Summary=${formatCurrency(summary.total_investments)}, Actual=${formatCurrency(actualInvestments)}`
    );
  }

  if (issues.length > 0) {
    return {
      passed: false,
      message: `❌ MonthlySummary #${summary.id} does not match transaction aggregates`,
      details: {
        summaryId: summary.id,
        userId: summary.userId,
        monthYear: summary.month_year.toISOString(),
        issues,
      },
    };
  }

  return {
    passed: true,
    message: `✅ MonthlySummary #${summary.id} matches transaction aggregates`,
  };
}

/**
 * Verifies the 50/30/10/10 rule compliance (if total_income > 0)
 * Note: This checks if expenses align with the rule, but doesn't enforce it
 */
async function verifyGoldRuleCompliance(
  summary: {
    id: number;
    userId: number;
    month_year: Date;
    total_income: Decimal;
    needs_expenses: Decimal;
    wants_expenses: Decimal;
    total_savings: Decimal;
    total_investments: Decimal;
  }
): Promise<VerificationResult> {
  // Only check if there's income
  if (summary.total_income.isZero()) {
    return {
      passed: true,
      message: `⏭️  MonthlySummary #${summary.id} has no income, skipping rule check`,
    };
  }

  const totalExpenses = summary.needs_expenses
    .add(summary.wants_expenses)
    .add(summary.total_savings)
    .add(summary.total_investments);

  // Calculate percentages
  const needsPercent = decimalToNumber(
    summary.needs_expenses.div(summary.total_income).mul(100)
  );
  const wantsPercent = decimalToNumber(
    summary.wants_expenses.div(summary.total_income).mul(100)
  );
  const reservesPercent = decimalToNumber(
    summary.total_savings.div(summary.total_income).mul(100)
  );
  const investmentsPercent = decimalToNumber(
    summary.total_investments.div(summary.total_income).mul(100)
  );
  const totalPercent = needsPercent + wantsPercent + reservesPercent + investmentsPercent;

  const warnings: string[] = [];

  // Check if percentages align with 50/30/10/10 (with 5% tolerance)
  if (Math.abs(needsPercent - GOLD_RULE_PERCENTAGES.NEEDS) > 5) {
    warnings.push(
      `Needs: ${needsPercent.toFixed(2)}% (target: ${GOLD_RULE_PERCENTAGES.NEEDS}%)`
    );
  }

  if (Math.abs(wantsPercent - GOLD_RULE_PERCENTAGES.WANTS) > 5) {
    warnings.push(
      `Wants: ${wantsPercent.toFixed(2)}% (target: ${GOLD_RULE_PERCENTAGES.WANTS}%)`
    );
  }

  if (Math.abs(reservesPercent - GOLD_RULE_PERCENTAGES.RESERVES) > 5) {
    warnings.push(
      `Reserves: ${reservesPercent.toFixed(2)}% (target: ${GOLD_RULE_PERCENTAGES.RESERVES}%)`
    );
  }

  if (Math.abs(investmentsPercent - GOLD_RULE_PERCENTAGES.INVESTMENTS) > 5) {
    warnings.push(
      `Investments: ${investmentsPercent.toFixed(2)}% (target: ${GOLD_RULE_PERCENTAGES.INVESTMENTS}%)`
    );
  }

  // Check if total expenses exceed income
  if (totalExpenses.greaterThan(summary.total_income)) {
    warnings.push(
      `⚠️  Total expenses (${formatCurrency(totalExpenses)}) exceed income (${formatCurrency(summary.total_income)})`
    );
  }

  if (warnings.length > 0) {
    return {
      passed: true, // Not a failure, just a warning
      message: `⚠️  MonthlySummary #${summary.id} deviates from 50/30/10/10 rule`,
      details: {
        summaryId: summary.id,
        userId: summary.userId,
        monthYear: summary.month_year.toISOString(),
        totalIncome: formatCurrency(summary.total_income),
        percentages: {
          needs: `${needsPercent.toFixed(2)}%`,
          wants: `${wantsPercent.toFixed(2)}%`,
          reserves: `${reservesPercent.toFixed(2)}%`,
          investments: `${investmentsPercent.toFixed(2)}%`,
          total: `${totalPercent.toFixed(2)}%`,
        },
        warnings,
      },
    };
  }

  return {
    passed: true,
    message: `✅ MonthlySummary #${summary.id} complies with 50/30/10/10 rule`,
    details: {
      percentages: {
        needs: `${needsPercent.toFixed(2)}%`,
        wants: `${wantsPercent.toFixed(2)}%`,
        reserves: `${reservesPercent.toFixed(2)}%`,
        investments: `${investmentsPercent.toFixed(2)}%`,
      },
    },
  };
}

/**
 * Checks for edge cases in transactions
 */
async function checkTransactionEdgeCases(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  // Check for negative amounts (should not exist)
  const negativeTransactions = await prisma.transaction.findMany({
    where: {
      amount: {
        lt: 0,
      },
    },
    select: {
      id: true,
      userId: true,
      amount: true,
      type: true,
      description: true,
    },
  });

  if (negativeTransactions.length > 0) {
    results.push({
      passed: false,
      message: `❌ Found ${negativeTransactions.length} transactions with negative amounts`,
      details: {
        transactions: negativeTransactions.map((t) => ({
          id: t.id,
          userId: t.userId,
          amount: formatCurrency(t.amount),
          type: t.type,
          description: t.description,
        })),
      },
    });
  } else {
    results.push({
      passed: true,
      message: '✅ No negative transaction amounts found',
    });
  }

  // Check for future dates (beyond reasonable)
  const maxReasonableDate = new Date();
  maxReasonableDate.setFullYear(maxReasonableDate.getFullYear() + 1);

  const futureTransactions = await prisma.transaction.findMany({
    where: {
      date: {
        gt: maxReasonableDate,
      },
    },
    select: {
      id: true,
      userId: true,
      date: true,
      type: true,
      description: true,
    },
  });

  if (futureTransactions.length > 0) {
    results.push({
      passed: false,
      message: `⚠️  Found ${futureTransactions.length} transactions with dates more than 1 year in the future`,
      details: {
        transactions: futureTransactions.map((t) => ({
          id: t.id,
          userId: t.userId,
          date: t.date.toISOString(),
          type: t.type,
          description: t.description,
        })),
      },
    });
  } else {
    results.push({
      passed: true,
      message: '✅ No suspicious future dates found',
    });
  }

  // Check for extremely large amounts
  const maxReasonableAmount = new Decimal(1_000_000_000); // 1 billion
  const largeTransactions = await prisma.transaction.findMany({
    where: {
      amount: {
        gt: maxReasonableAmount,
      },
    },
    select: {
      id: true,
      userId: true,
      amount: true,
      type: true,
      description: true,
    },
  });

  if (largeTransactions.length > 0) {
    results.push({
      passed: false,
      message: `⚠️  Found ${largeTransactions.length} transactions with extremely large amounts (>1B)`,
      details: {
        transactions: largeTransactions.map((t) => ({
          id: t.id,
          userId: t.userId,
          amount: formatCurrency(t.amount),
          type: t.type,
          description: t.description,
        })),
      },
    });
  } else {
    results.push({
      passed: true,
      message: '✅ No extremely large transaction amounts found',
    });
  }

  return results;
}

// ============================================================================
// MAIN VERIFICATION FUNCTION
// ============================================================================
async function runVerification() {
  console.log('🧪 QA: Financial Calculations Verification\n');
  console.log('=' .repeat(60));
  console.log('');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get all MonthlySummaries
    const summaries = await prisma.monthlySummary.findMany({
      orderBy: [
        { userId: 'asc' },
        { month_year: 'asc' },
      ],
    });

    console.log(`📊 Found ${summaries.length} MonthlySummary records to verify\n`);

    if (summaries.length === 0) {
      console.log('⚠️  No MonthlySummary records found. Run the app and create some transactions first.');
      await prisma.$disconnect();
      process.exit(0);
    }

    const allResults: VerificationResult[] = [];
    let passedCount = 0;
    let failedCount = 0;
    let warningCount = 0;

    // Verify each summary
    for (const summary of summaries) {
      console.log(`\n🔍 Verifying MonthlySummary #${summary.id} (User ${summary.userId}, ${summary.month_year.toISOString().split('T')[0]})`);
      console.log('-'.repeat(60));

      // 1. Verify calculation
      const calcResult = await verifyMonthlySummaryCalculation(summary);
      console.log(`  ${calcResult.message}`);
      allResults.push(calcResult);
      if (calcResult.passed) passedCount++; else failedCount++;

      // 2. Verify data integrity
      const integrityResult = await verifySummaryMatchesTransactions(summary);
      console.log(`  ${integrityResult.message}`);
      allResults.push(integrityResult);
      if (integrityResult.passed) passedCount++; else failedCount++;

      // 3. Verify Gold Rule compliance (warning only)
      const ruleResult = await verifyGoldRuleCompliance(summary);
      console.log(`  ${ruleResult.message}`);
      allResults.push(ruleResult);
      if (ruleResult.passed && !ruleResult.message.includes('⚠️')) {
        passedCount++;
      } else if (ruleResult.message.includes('⚠️')) {
        warningCount++;
      }

      // Print details if there are issues
      if (!calcResult.passed && calcResult.details) {
        console.log('  Details:', JSON.stringify(calcResult.details, null, 2));
      }
      if (!integrityResult.passed && integrityResult.details) {
        console.log('  Details:', JSON.stringify(integrityResult.details, null, 2));
      }
      if (ruleResult.details && ruleResult.message.includes('⚠️')) {
        console.log('  Details:', JSON.stringify(ruleResult.details, null, 2));
      }
    }

    // Check edge cases
    console.log('\n\n🔍 Checking Transaction Edge Cases');
    console.log('='.repeat(60));
    const edgeCaseResults = await checkTransactionEdgeCases();
    for (const result of edgeCaseResults) {
      console.log(`\n${result.message}`);
      if (result.details) {
        console.log('  Details:', JSON.stringify(result.details, null, 2));
      }
      allResults.push(result);
      if (result.passed) passedCount++; else failedCount++;
    }

    // Summary
    console.log('\n\n📈 Verification Summary');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passedCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    console.log(`📊 Total Checks: ${allResults.length}`);

    const successRate = ((passedCount / allResults.length) * 100).toFixed(2);
    console.log(`\n📊 Success Rate: ${successRate}%`);

    if (failedCount > 0) {
      console.log('\n❌ Some verifications failed. Review the details above.');
      await prisma.$disconnect();
      process.exit(1);
    } else {
      console.log('\n✨ All critical verifications passed!');
      if (warningCount > 0) {
        console.log('⚠️  Some warnings were found. Review them above.');
      }
      await prisma.$disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Verification failed with error:');
    console.error(error);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

// Run verification
runVerification();
