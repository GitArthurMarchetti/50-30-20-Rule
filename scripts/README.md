# Scripts Documentation

This directory contains utility scripts for managing and testing your application.

## Available Scripts

### Environment & Health Checks

#### `check-env.ts`
Validates that all required environment variables are set.

```bash
npm run check:env
```

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database connection (for migrations)
- `JWT_SECRET` - Secret key for JWT token signing

**Note:** The script checks both `.env` and `.env.local` files. `.env.local` takes precedence over `.env` (matching Next.js behavior). This is the standard Next.js convention for local development.

#### `health-check.ts`
Tests database connectivity and Prisma client functionality.

```bash
npm run check:health
```

#### `verify-financial-calculations.ts` 🧪
**QA Verification Script** - Verifies financial calculations, data integrity, and edge cases.

```bash
npm run verify:calculations
```

**What it verifies:**
- ✅ **MonthlySummary calculations**: Ensures `final_balance` is calculated correctly
  - Formula: `starting_balance + total_income - needs_expenses - wants_expenses - total_savings - total_investments`
- ✅ **Data integrity**: Verifies that `MonthlySummary` aggregates match actual `Transaction` totals
- ✅ **50/30/10/10 rule compliance**: Checks if expenses align with the Gold Rule percentages (warning only, not enforced)
- ✅ **Edge cases**:
  - Negative transaction amounts (should not exist)
  - Future dates beyond 1 year (suspicious)
  - Extremely large amounts (>1B, suspicious)

**Output:**
- Shows detailed results for each MonthlySummary
- Reports any calculation errors or data mismatches
- Provides warnings for rule deviations
- Exits with code 1 if critical issues are found

#### `test-transaction-import.ts` 🧪
**QA Test Script** - Tests transaction import functionality with edge cases.

```bash
npm run test:import
```

**Test cases covered:**
1. ✅ **Empty file upload** - Verifies rejection of empty files
2. ✅ **Invalid CSV/JSON format** - Tests handling of malformed files
3. ✅ **Duplicate detection** - Verifies detection of transactions with same date + amount
4. ✅ **Expired pending transactions** - Tests TTL expiration (5 hours)
5. ✅ **Batch commit with mixed IDs** - Tests commit with valid/invalid pending transaction IDs
6. ✅ **Category type compatibility** - Validates category type matches transaction type
7. ✅ **MonthlySummary update correctness** - Verifies 50/30/10/10 rule compliance after updates
8. ✅ **Atomic operations** - Tests rollback on error (transaction integrity)
9. ✅ **Large files** - Performance test with 1000+ transactions

**Output:**
- Runs all test cases sequentially
- Shows pass/fail status for each test
- Provides detailed results and statistics
- Exits with code 1 if any test fails

### Database Management

#### `reset-db.ts`
Resets the database, runs migrations, and optionally seeds data.

```bash
# Reset database and run migrations
npm run db:reset:full

# Reset database, run migrations, and seed data
npm run db:reset:seed
```

## NPM Scripts Reference

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run type-check` - Check TypeScript types without building
- `npm run validate` - Run all validation checks (type-check + lint + db:validate)

### Database
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Create and apply a new migration
- `npm run db:migrate:deploy` - Apply pending migrations (production)
- `npm run db:migrate:reset` - Reset database and apply all migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:push` - Push schema changes to database (dev only)
- `npm run db:pull` - Pull schema from database
- `npm run db:seed` - Seed database with sample data
- `npm run db:format` - Format Prisma schema
- `npm run db:validate` - Validate Prisma schema

### Utilities
- `npm run clean` - Clean build cache
- `npm run clean:all` - Clean build cache and generated Prisma client
- `npm run check:env` - Check environment variables
- `npm run check:health` - Check database health
- `npm run verify:calculations` - Verify financial calculations and data integrity (QA)
- `npm run test:import` - Test transaction import functionality with edge cases (QA)

## Workflow Examples

### Initial Setup
```bash
# 1. Install dependencies
npm install

# 2. Check environment variables
npm run check:env

# 3. Generate Prisma Client
npm run db:generate

# 4. Run migrations
npm run db:migrate

# 5. Seed database (optional)
npm run db:seed

# 6. Start development server
npm run dev
```

### Before Committing
```bash
# Run all validation checks
npm run validate

# Or individually:
npm run type-check
npm run lint
npm run db:validate

# Verify financial calculations (QA)
npm run verify:calculations
```

### Database Changes
```bash
# 1. Modify schema.prisma
# 2. Create migration
npm run db:migrate

# 3. Generate client
npm run db:generate

# 4. Test changes
npm run check:health
```

### Reset Development Database
```bash
# Reset and seed with sample data
npm run db:reset:seed
```

## Creating New Scripts

To create a new script:

1. Create a TypeScript file in the `scripts/` directory
2. Add a shebang at the top: `#!/usr/bin/env tsx`
3. Add the script command to `package.json`:
   ```json
   "your-script": "tsx scripts/your-script.ts"
   ```
4. Run it with: `npm run your-script`

## Tips

- Use `npm run validate` before committing to catch issues early
- Use `npm run db:studio` to visually inspect your database
- Use `npm run check:health` to verify database connectivity
- Use `npm run clean:all` if you encounter weird build issues

