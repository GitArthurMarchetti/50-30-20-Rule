# Contributing to Gold Rule

First off, thank you for considering contributing to Gold Rule! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)
- **Environment** (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Clear title and description**
- **Use case** - why is this enhancement useful?
- **Proposed solution** (if you have one)
- **Alternatives considered** (if any)

### Pull Requests

- Fill in the required template
- Do not include issue numbers in the PR title
- Include screenshots and animated GIFs in your pull request whenever possible
- Follow the coding standards (see below)
- Include thoughtfully-worded, well-structured tests
- Document new code based on the Documentation Styleguide
- End all files with a newline

## Development Setup

1. **Fork the repository**

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/gold-rule.git
   cd gold-rule
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

5. **Set up the database:**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

6. **Verify setup:**
   ```bash
   npm run check:env
   npm run check:health
   ```

## Development Process

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**

3. **Run validation:**
   ```bash
   npm run validate
   ```

4. **Test your changes:**
   ```bash
   npm run dev
   # Test manually or run automated tests
   ```

5. **Commit your changes** (see [Commit Guidelines](#commit-guidelines))

6. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public functions
- Use type inference where appropriate, but be explicit when it improves clarity

### File Organization

Follow the existing structure:
```
app/
├── api/              # API routes
├── components/       # React components
├── lib/              # Utilities and services
└── (pages)/          # Page routes
```

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings (unless double quotes are needed)
- Use trailing commas in multi-line objects/arrays
- Maximum line length: 100 characters
- Use `const` by default, `let` when reassignment is needed

### Component Structure

```typescript
// ============================================================================
// IMPORTS
// ============================================================================
// External
import { useState } from 'react';

// Internal - Types
import { User } from '@/app/types';

// Internal - Components
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================
interface ComponentProps {
  // ...
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function Component({ ... }: ComponentProps) {
  // ...
}
```

### API Routes

- Always use `withAuth` for protected routes
- Validate all input using `@/app/lib/validators`
- Use proper HTTP status codes
- Return consistent error responses
- Use `prisma.$transaction` for atomic operations

### Database

- Always update `MonthlySummary` when modifying `Transactions`
- Use incremental updates via `updateMonthlySummaryIncrementalWithTx`
- Never modify `Transactions` without updating `MonthlySummary`

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(transactions): add bulk import functionality

fix(auth): resolve JWT token expiration issue

docs(readme): update installation instructions
```

## Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Update CHANGELOG.md** with your changes (if applicable)
3. **Ensure all tests pass** and add tests for new functionality
4. **Run `npm run validate`** to ensure code quality
5. **Request review** from maintainers
6. **Address review feedback** promptly

### PR Checklist

- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] `npm run validate` passes

## Questions?

Feel free to open an issue for any questions you might have about contributing!

Thank you for contributing to Gold Rule! 🙏
