# 📐 Guia de Organização de Código

Este documento descreve o padrão de organização visual e estrutural usado no projeto.

## 🎯 Princípios

1. **Consistência**: Todos os arquivos seguem o mesmo padrão
2. **Legibilidade**: Código fácil de ler e navegar
3. **Manutenibilidade**: Estrutura clara facilita manutenção
4. **Profissionalismo**: Código limpo e bem organizado

## 📁 Estrutura de Arquivos

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
    // ... código de validação

    // ------------------------------------------------------------------------
    // Business Logic
    // ------------------------------------------------------------------------
    // ... código de negócio

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

### Componentes React (`app/components/**/*.tsx`)

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
    // ... efeito
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

### Serviços (`app/lib/services/**/*.ts`)

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

## 📋 Regras de Organização

### 1. Imports

**Ordem:**
1. External (bibliotecas npm)
2. Internal - Types (tipos e interfaces)
3. Internal - Services (serviços e APIs)
4. Internal - Context (contextos React)
5. Internal - Components (componentes React)
6. Internal - Utilities (helpers e utils)

**Agrupamento:**
- Um grupo por categoria
- Linha em branco entre grupos
- Comentário descritivo para cada grupo

### 2. Seções

Use comentários de seção para organizar:

```typescript
// ============================================================================
// NOME DA SEÇÃO (MAIÚSCULAS)
// ============================================================================
```

**Seções comuns:**
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

### 3. Sub-seções

Use comentários de sub-seção para detalhar:

```typescript
// --------------------------------------------------------------------------
// Nome da Sub-seção
// --------------------------------------------------------------------------
```

**Sub-seções comuns:**
- `State` (React)
- `Parse & Validate`
- `Business Logic`
- `Success Response`
- `Error Handling`

### 4. Espaçamento

- **2 linhas em branco** entre seções principais
- **1 linha em branco** entre sub-seções
- **1 linha em branco** entre funções/componentes relacionados
- **Sem linhas em branco** dentro de blocos lógicos

### 5. Comentários

- **Seções**: Comentários de seção para organização
- **Código**: Comentários apenas quando necessário para clareza
- **JSDoc**: Para funções exportadas públicas

### 6. Formatação

- **Indentação**: 2 espaços
- **Linha máxima**: 80 caracteres (quando possível)
- **Aspas**: Duplas (`"`)
- **Ponto e vírgula**: Sempre (`;`)

## ✅ Checklist de Organização

Antes de commitar, verifique:

- [ ] Imports organizados por categoria
- [ ] Seções principais com comentários
- [ ] Sub-seções quando necessário
- [ ] Espaçamento consistente
- [ ] Nomes descritivos
- [ ] Código sem redundâncias
- [ ] Comentários apenas quando necessário

## 🎨 Exemplo Completo

Veja `app/api/transactions/route.ts` e `app/page.tsx` para exemplos completos de organização.

---

**Última atualização**: Dezembro 2024
