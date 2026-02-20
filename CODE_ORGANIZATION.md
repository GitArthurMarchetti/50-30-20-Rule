# 📐 Code Organization Guide

This document describes the visual and structural organization pattern used in the project.

## 🎯 Principles

1. **Consistency**: All files follow the same pattern
2. **Readability**: Code that's easy to read and navigate
3. **Maintainability**: Clear structure facilitates maintenance
4. **Professionalism**: Clean and well-organized code

## 📁 File Structure

### API Routes (`app/api/**/route.ts`)

```typescript
// ============================================================================
// IMPORTS
// ============================================================================
// External
import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";

// Internal - Types
import { TransactionType } from "@/app/generated/prisma";
import { SessionUser } from "@/app/lib/auth-server";
import { AuthenticatedHandler, RouteContext, withAuth } from "@/app/lib/auth-helpers";

// Internal - Services
import { prisma } from "@/prisma/db";
import { updateMonthlySummaryIncrementalWithTx } from "@/app/lib/services/summary-service";

// Internal - Utilities
import { badRequestResponse, notFoundResponse } from "@/app/lib/errors/responses";
import { safeParseJson, isValidTransactionType } from "@/app/lib/validators";
import { logSuccess, logError } from "@/app/lib/logger";

// ============================================================================
// TYPES
// ============================================================================
type RouteParams = {
  id: string;
};

// ============================================================================
// HANDLERS
// ============================================================================
const postHandler: AuthenticatedHandler<RouteParams> = async (
  request: NextRequest,
  context: RouteContext<RouteParams>,
  session: SessionUser
) => {
  try {
    // ------------------------------------------------------------------------
    // Parse & Validate Request Body
    // ------------------------------------------------------------------------
    // ... validation code

    // ------------------------------------------------------------------------
    // Business Logic
    // ------------------------------------------------------------------------
    // ... business logic code

    // ------------------------------------------------------------------------
    // Success Response
    // ------------------------------------------------------------------------
    logSuccess("Operation completed", { ... });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    logError("Operation failed", error, { ... });
    return internalErrorResponse("Operation failed");
  }
};

// ============================================================================
// EXPORTS
// ============================================================================
export const POST = withAuth(postHandler, {
  requireCsrf: true,
  requireContentType: true,
});
```

### React Components (`app/components/**/*.tsx`)

```typescript
"use client";

// ============================================================================
// IMPORTS
// ============================================================================
// External
import { useState, useEffect, useCallback } from "react";
import { PlusCircle } from "lucide-react";

// Internal - Types
import { TransactionType } from "@/app/generated/prisma";

// Internal - Services
import { categoryService, Category } from "@/app/lib/client/category-service";

// Internal - Context
import { useDashboard } from "@/app/context/DashboardContex";

// Internal - Components
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ============================================================================
// TYPES
// ============================================================================
interface ComponentProps {
  categoryType: TransactionType;
  onTransactionAdded: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function Component({ categoryType, onTransactionAdded }: ComponentProps) {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------
  useEffect(() => {
    // ... effect
  }, [dependencies]);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------
  const handleSubmit = useCallback(async () => {
    // ... handler
  }, [dependencies]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Services (`app/lib/services/**/*.ts`)

```typescript
// ============================================================================
// IMPORTS
// ============================================================================
// External
import { Decimal } from "@prisma/client/runtime/library";

// Internal - Types
import { TransactionType, Prisma } from "@/app/generated/prisma";

// Internal - Services
import { prisma } from "@/prisma/db";

// Internal - Utilities
import { getTransactionTypeConfig } from "./transaction-type-config";

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
 * Helper function description
 * @param param - Parameter description
 * @returns Return description
 */
async function helperFunction(param: string): Promise<number> {
  // Implementation
}

// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================
/**
 * Main function description
 */
export async function mainFunction(): Promise<void> {
  // Implementation
}
```

## 📋 Organization Rules

### 1. Imports

**Order:**
1. External (npm libraries)
2. Internal - Types (types and interfaces)
3. Internal - Services (services and APIs)
4. Internal - Context (React contexts)
5. Internal - Components (React components)
6. Internal - Utilities (helpers and utils)

**Grouping:**
- One group per category
- Blank line between groups
- Descriptive comment for each group

### 2. Sections

Use section comments to organize:

```typescript
// ============================================================================
// SECTION NAME (UPPERCASE)
// ============================================================================
```

**Common sections:**
- `IMPORTS`
- `TYPES`
- `CONSTANTS`
- `HELPER FUNCTIONS`
- `HANDLERS` (API routes)
- `COMPONENT` (React)
- `EFFECTS` (React)
- `HANDLERS` (React)
- `RENDER` (React)
- `EXPORTS`

### 3. Sub-sections

Use sub-section comments to detail:

```typescript
// --------------------------------------------------------------------------
// Sub-section Name
// --------------------------------------------------------------------------
```

**Common sub-sections:**
- `State` (React)
- `Parse & Validate`
- `Business Logic`
- `Success Response`
- `Error Handling`

### 4. Spacing

- **2 blank lines** between main sections
- **1 blank line** between sub-sections
- **1 blank line** between related functions/components
- **No blank lines** within logical blocks

### 5. Comments

- **Sections**: Section comments for organization
- **Code**: Comments only when necessary for clarity
- **JSDoc**: For exported public functions

### 6. Formatting

- **Indentation**: 2 spaces
- **Max line length**: 80 characters (when possible)
- **Quotes**: Double (`"`)
- **Semicolon**: Always (`;`)

## ✅ Organization Checklist

Before committing, verify:

- [ ] Imports organized by category
- [ ] Main sections with comments
- [ ] Sub-sections when necessary
- [ ] Consistent spacing
- [ ] Descriptive names
- [ ] Code without redundancies
- [ ] Comments only when necessary

## 🎨 Complete Example

See `app/api/transactions/route.ts` and `app/page.tsx` for complete organization examples.

---
