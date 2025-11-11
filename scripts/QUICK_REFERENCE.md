# Quick Reference - NPM Scripts

## 🚀 Most Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality (run before committing)
npm run validate         # Run all checks (types + lint + db)

# Database
npm run db:migrate       # Create/apply migration
npm run db:studio        # Open Prisma Studio (GUI)
npm run db:seed          # Seed database
npm run db:reset:seed    # Reset & seed database

# Health Checks
npm run check:env        # Check environment variables
npm run check:health     # Check database connectivity
```

## 📋 Complete Script List

### Development
- `dev` - Start development server
- `build` - Build for production
- `start` - Start production server

### Code Quality
- `lint` - Run ESLint
- `lint:fix` - Fix ESLint errors
- `type-check` - Check TypeScript types
- `validate` - Run all validation checks

### Database
- `db:generate` - Generate Prisma Client
- `db:migrate` - Create/apply migration
- `db:migrate:deploy` - Deploy migrations (production)
- `db:migrate:reset` - Reset database
- `db:studio` - Open Prisma Studio
- `db:push` - Push schema (dev only)
- `db:pull` - Pull schema
- `db:seed` - Seed database
- `db:format` - Format schema
- `db:validate` - Validate schema
- `db:reset:full` - Full database reset
- `db:reset:seed` - Reset & seed

### Utilities
- `clean` - Clean build cache
- `clean:all` - Clean everything
- `check:env` - Check environment
- `check:health` - Check database health

## 💡 Tips

1. **Before committing**: `npm run validate`
2. **Database issues**: `npm run check:health`
3. **Reset dev database**: `npm run db:reset:seed`
4. **View database**: `npm run db:studio`
5. **Environment setup**: `npm run check:env`

## 🔄 Common Workflows

### Setup New Environment
```bash
npm install
npm run check:env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

### Before Committing
```bash
npm run validate
```

### Database Changes
```bash
# Edit prisma/schema.prisma
npm run db:migrate
npm run check:health
```

### Reset Everything
```bash
npm run clean:all
npm install
npm run db:reset:seed
```

