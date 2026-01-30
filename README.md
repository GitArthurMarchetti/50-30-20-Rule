# Gold Rule - Personal Finance Management

This is a [Next.js](https://nextjs.org) project for managing personal finances using the "Gold Rule" budgeting methodology.

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory with the following variables:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
   DIRECT_URL="postgresql://user:password@host:port/database?schema=public"
   JWT_SECRET="your-secret-key-here"
   NODE_ENV="development"
   ```

3. **Verify environment setup:**
   ```bash
   npm run check:env
   ```

4. **Set up the database:**
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # (Optional) Seed with sample data
   npm run db:seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Available Scripts

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run type-check` - Check TypeScript types without building
- `npm run validate` - Run all validation checks (type-check + lint + db:validate)

### Database Management
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
- `npm run db:reset:full` - Reset database (full reset)
- `npm run db:reset:seed` - Reset database and seed with sample data

### Utilities
- `npm run clean` - Clean build cache
- `npm run clean:all` - Clean build cache and generated Prisma client
- `npm run check:env` - Check environment variables
- `npm run check:health` - Check database health and connectivity
- `npm run check:security` - Run security checks and validations
- `npm run generate:jwt-secret` - Generate a secure JWT secret

## 📁 Project Structure

```
gold-rule/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── lib/               # Utility functions and services
│   └── (pages)/           # Page routes
├── prisma/                # Prisma schema and migrations
│   ├── schema.prisma      # Database schema
│   ├── seed.ts           # Database seed script
│   └── migrations/        # Migration files
├── scripts/               # Utility scripts
│   ├── check-env.ts      # Environment variable checker
│   ├── health-check.ts   # Database health check
│   └── reset-db.ts       # Database reset script
└── public/                # Static files
```

## 🔧 Development Workflow

### Before Committing
```bash
# Run all validation checks
npm run validate
```

### Making Database Changes
```bash
# 1. Modify prisma/schema.prisma
# 2. Create migration
npm run db:migrate

# 3. Generate client (automatically runs on build)
npm run db:generate

# 4. Test changes
npm run check:health
```

### Resetting Development Database
```bash
# Reset and seed with sample data
npm run db:reset:seed
```

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Prisma Documentation](https://www.prisma.io/docs) - learn about Prisma ORM
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - learn about TypeScript

## 🚢 Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Before deploying:
1. Set up environment variables in your hosting platform
2. Run `npm run build` to verify the build works
3. Ensure your database is accessible from the production environment

## 🔒 Security

This project implements multiple security measures to protect against common vulnerabilities:

- **Authentication**: JWT-based authentication with secure cookie storage
- **CSRF Protection**: Double Submit Cookie pattern for CSRF protection
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive validation and sanitization
- **Security Headers**: HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS**: Explicit CORS configuration
- **XSS Protection**: Input sanitization to prevent XSS attacks

### Security Checklist

Before deploying to production:

```bash
# Run security checks
npm run check:security

# Verify environment variables
npm run check:env

# Generate secure JWT secret (if needed)
npm run generate:jwt-secret
```

For detailed security documentation, see [SECURITY.md](./SECURITY.md).

## 📖 Scripts Documentation

For detailed documentation about the utility scripts, see [scripts/README.md](./scripts/README.md).
