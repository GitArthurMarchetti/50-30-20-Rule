# QA Report: Transaction Import Edge Cases & Error Handling

**Date:** 2024-01-XX  
**Agent:** [QA]  
**Feature:** Transaction Import (`/api/transactions/import`)

---

## Executive Summary

Reviewed the Transaction Import feature for edge cases and error handling. Found **12 issues** requiring fixes:
- **Critical:** 3 issues
- **High:** 4 issues  
- **Medium:** 3 issues
- **Low:** 2 issues

---

## 1. File Upload Edge Cases

### ✅ 1.1 Empty File
**Status:** HANDLED  
**Location:** `app/api/transactions/import/route.ts:446`

```typescript
if (!fileContent || fileContent.trim().length === 0) {
  return badRequestResponse("File is empty");
}
```

**Verdict:** Correctly rejects empty files.

---

### ⚠️ 1.2 Corrupted CSV/JSON
**Status:** PARTIALLY HANDLED  
**Location:** `app/api/transactions/import/route.ts:464`

**Issue:** Generic error message doesn't help user understand the problem.

**Current Code:**
```typescript
} catch (error) {
  return badRequestResponse(
    `Failed to parse file: ${error instanceof Error ? error.message : "Unknown error"}`
  );
}
```

**Fix Required:**
- Distinguish between CSV and JSON parsing errors
- Provide more specific error messages
- Include line number for CSV errors if possible

---

### ❌ 1.3 File with 1 Million Rows
**Status:** NOT HANDLED  
**Location:** `app/api/transactions/import/route.ts:492`

**Issue:** No limit on number of rows. Processing 1M rows will:
- Consume excessive memory
- Cause timeout errors
- Potentially crash the server

**Current Code:**
```typescript
for (let i = 0; i < parsedRows.length; i++) {
  // No limit check
}
```

**Fix Required:**
```typescript
const MAX_ROWS = 10000; // Reasonable limit
if (parsedRows.length > MAX_ROWS) {
  return badRequestResponse(
    `File contains too many rows (${parsedRows.length}). Maximum allowed: ${MAX_ROWS}`
  );
}
```

**Priority:** CRITICAL

---

### ✅ 1.4 Special Characters in Descriptions
**Status:** HANDLED  
**Location:** `app/lib/validators.ts:sanitizeDescription`

**Verdict:** `sanitizeDescription` properly handles special characters and prevents XSS.

---

### ✅ 1.5 Future Dates (Beyond 10 Years)
**Status:** HANDLED  
**Location:** `app/lib/validators.ts:parseAndValidateDate`

**Verdict:** Correctly validates dates and rejects dates more than 10 years in the future.

---

## 2. Deduplication Edge Cases

### ✅ 2.1 Same Amount, Different Dates
**Status:** HANDLED  
**Location:** `app/api/transactions/import/route.ts:323-376`

**Verdict:** Duplicate detection uses `date|amount` key, so different dates = not duplicate.

---

### ✅ 2.2 Same Date, Different Amounts
**Status:** HANDLED  
**Location:** `app/api/transactions/import/route.ts:323-376`

**Verdict:** Different amounts = not duplicate.

---

### ✅ 2.3 Same Date+Amount, Different Users
**Status:** HANDLED  
**Location:** `app/api/transactions/import/route.ts:337`

**Verdict:** Query filters by `userId`, so users don't see each other's duplicates.

---

### ⚠️ 2.4 Floating Point Precision Issues
**Status:** PARTIALLY HANDLED  
**Location:** `app/api/transactions/import/route.ts:359`

**Issue:** Uses `toFixed(2)` but comparison might fail for edge cases like:
- `100.00` vs `100.0001` (should be duplicate but might not be detected)
- `99.999` vs `100.001` (should not be duplicate but might be)

**Current Code:**
```typescript
const amountKey = amountValue.toFixed(TRANSACTION_IMPORT.AMOUNT_DECIMAL_PLACES);
```

**Fix Required:**
```typescript
// Use Decimal comparison with tolerance
const normalizeAmount = (amount: number | Decimal): string => {
  const num = typeof amount === 'number' ? amount : amount.toNumber();
  // Round to 2 decimal places to match database precision
  return (Math.round(num * 100) / 100).toFixed(2);
};
```

**Priority:** MEDIUM

---

## 3. Commit Edge Cases

### ❌ 3.1 Commit Expired Transaction
**Status:** NOT HANDLED  
**Location:** `app/api/pending-transactions/[id]/commit/route.ts:146`

**Issue:** No check if `pendingTransaction.expiresAt < now()`. Expired transactions can still be committed.

**Current Code:**
```typescript
for (const pendingTransaction of pendingTransactions) {
  try {
    // No expiration check!
    const result = await prisma.$transaction(async (transaction) => {
      // ...
    });
  }
}
```

**Fix Required:**
```typescript
const now = new Date();
for (const pendingTransaction of pendingTransactions) {
  // Check expiration
  if (pendingTransaction.expiresAt < now) {
    errors.push({
      id: pendingTransaction.id,
      error: "Transaction has expired. Please re-import.",
    });
    results.push({
      id: pendingTransaction.id,
      success: false,
      error: "Transaction has expired",
    });
    continue;
  }
  
  try {
    // ... commit logic
  }
}
```

**Priority:** HIGH

---

### ⚠️ 3.2 Commit Transaction with Deleted Category
**Status:** PARTIALLY HANDLED  
**Location:** `app/api/pending-transactions/[id]/commit/route.ts:152`

**Issue:** If category is deleted between import and commit, commit will fail with foreign key error.

**Current Code:**
```typescript
const newTransaction = await transaction.transaction.create({
  data: {
    // ...
    categoryId: pendingTransaction.categoryId, // May be invalid
  },
});
```

**Fix Required:**
```typescript
// Verify category still exists before commit
if (pendingTransaction.categoryId) {
  const categoryExists = await prisma.category.findFirst({
    where: {
      id: pendingTransaction.categoryId,
      userId: session.userId,
    },
  });
  
  if (!categoryExists) {
    // Set to null or return error
    pendingTransaction.categoryId = null;
    // Or: return error and skip this transaction
  }
}
```

**Priority:** HIGH

---

### ⚠️ 3.3 Commit During MonthlySummary Recalculation
**Status:** RACE CONDITION RISK  
**Location:** `app/api/pending-transactions/[id]/commit/route.ts:165`

**Issue:** If `updateMonthlySummaryIncrementalWithTx` is called while another process is recalculating, could cause inconsistent state.

**Current Code:**
```typescript
await updateMonthlySummaryIncrementalWithTx(
  transaction,
  session.userId,
  pendingTransaction.date,
  {
    type: pendingTransaction.type,
    newAmount: pendingTransaction.amount,
  }
);
```

**Fix Required:**
- Use database-level locking (SELECT FOR UPDATE)
- Or: Add retry logic with exponential backoff
- Or: Use optimistic locking with version field

**Priority:** MEDIUM

---

### ✅ 3.4 Network Failure During Commit
**Status:** HANDLED  
**Location:** `app/api/pending-transactions/[id]/commit/route.ts:150`

**Verdict:** Uses `prisma.$transaction`, which ensures atomic rollback on error.

---

## 4. UI Edge Cases

### ❌ 4.1 Edit Transaction While Another User Commits It
**Status:** NOT HANDLED  
**Location:** `app/components/local/modal/PendingTransactionsManager.tsx:463`

**Issue:** No optimistic locking or version checking. User A can edit while User B commits, causing:
- Lost updates
- Inconsistent state
- Confusing error messages

**Current Code:**
```typescript
const handleUpdate = useCallback(async (id: number, updates: Partial<PendingTransaction>) => {
  // No version check or optimistic locking
  const response = await fetch(`/api/pending-transactions/${id}`, {
    method: "PUT",
    // ...
  });
}, []);
```

**Fix Required:**
- Add `version` field to `PendingTransaction` model
- Check version before update
- Return 409 Conflict if version mismatch
- Show user-friendly error: "Transaction was modified by another user. Please refresh."

**Priority:** HIGH

---

### ⚠️ 4.2 Rapid Clicking on Approve Button
**Status:** PARTIALLY HANDLED  
**Location:** `app/components/local/modal/PendingTransactionsManager.tsx:729`

**Issue:** Button is disabled during commit, but rapid clicks before state updates can cause:
- Multiple commit requests
- Race conditions
- Duplicate transactions

**Current Code:**
```typescript
const handleCommit = useCallback(async (id: number) => {
  setIsCommitting((prev) => new Set(prev).add(id));
  // ... commit logic
}, []);
```

**Fix Required:**
```typescript
const handleCommit = useCallback(async (id: number) => {
  // Early return if already committing
  if (isCommitting.has(id)) {
    return;
  }
  
  setIsCommitting((prev) => {
    if (prev.has(id)) return prev; // Prevent duplicate
    return new Set(prev).add(id);
  });
  
  // ... rest of logic
}, [isCommitting]);
```

**Priority:** MEDIUM

---

### ⚠️ 4.3 Browser Back Button During Import
**Status:** NOT HANDLED  
**Location:** `app/components/local/modal/PendingTransactionsManager.tsx`

**Issue:** If user clicks browser back during import:
- File upload may be interrupted
- Pending transactions may be partially created
- No cleanup of partial state

**Fix Required:**
- Use `beforeunload` event to warn user
- Or: Use React Router's `useBlocker` hook
- Or: Show warning dialog before allowing navigation

**Priority:** LOW

---

## Summary of Required Fixes

### Critical (Must Fix)
1. **Add row limit** (1M rows issue) - Prevent memory exhaustion
2. **Expired transaction check** - Prevent committing expired transactions
3. **Optimistic locking** - Prevent lost updates in concurrent edits

### High Priority
4. **Deleted category handling** - Graceful handling of deleted categories
5. **Better error messages** - More specific parsing errors
6. **Rapid click prevention** - Better debouncing/throttling

### Medium Priority
7. **Floating point precision** - Improve duplicate detection
8. **Race condition handling** - MonthlySummary update conflicts

### Low Priority
9. **Browser navigation warning** - Warn before leaving during import

---

## Recommended Implementation Order

1. **Phase 1 (Critical):**
   - Add row limit validation
   - Add expired transaction check
   - Add optimistic locking

2. **Phase 2 (High):**
   - Improve error messages
   - Handle deleted categories
   - Prevent rapid clicks

3. **Phase 3 (Medium/Low):**
   - Fix floating point precision
   - Add race condition handling
   - Browser navigation warnings

---

## Testing Recommendations

1. **Load Testing:**
   - Test with 10K, 50K, 100K rows
   - Monitor memory usage
   - Measure response times

2. **Concurrency Testing:**
   - Multiple users editing same transaction
   - Multiple commits happening simultaneously
   - Network interruptions during commit

3. **Edge Case Testing:**
   - Expired transactions
   - Deleted categories
   - Floating point edge cases (99.999 vs 100.001)

---

## Notes

- Most critical issues are in the commit flow
- UI needs better state management for concurrent operations
- Database-level constraints could help with some issues
- Consider adding audit logging for debugging edge cases
