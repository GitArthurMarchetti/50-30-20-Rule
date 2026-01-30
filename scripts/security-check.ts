#!/usr/bin/env tsx
/**
 * Security Check Script
 * Verifies security configurations and best practices
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { readFileSync } from 'fs';

const envPath = resolve(process.cwd(), '.env');
const envLocalPath = resolve(process.cwd(), '.env.local');

// Load environment variables
if (existsSync(envPath)) {
  config({ path: envPath });
}
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
}

interface SecurityCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const checks: SecurityCheck[] = [];

// Check JWT_SECRET
function checkJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    checks.push({
      name: 'JWT_SECRET',
      status: 'fail',
      message: 'JWT_SECRET is not set',
    });
    return;
  }

  if (secret.length < 32) {
    checks.push({
      name: 'JWT_SECRET',
      status: 'fail',
      message: `JWT_SECRET is too short (${secret.length} chars). Minimum 32 characters recommended.`,
    });
    return;
  }

  if (secret === 'your-secret-key-here' || secret === 'secret' || secret.length < 16) {
    checks.push({
      name: 'JWT_SECRET',
      status: 'warning',
      message: 'JWT_SECRET appears to be weak or default value',
    });
    return;
  }

  checks.push({
    name: 'JWT_SECRET',
    status: 'pass',
    message: `JWT_SECRET is set and has ${secret.length} characters`,
  });
}

// Check NODE_ENV
function checkNodeEnv() {
  const nodeEnv = process.env.NODE_ENV;
  if (!nodeEnv) {
    checks.push({
      name: 'NODE_ENV',
      status: 'warning',
      message: 'NODE_ENV is not set (defaults to development)',
    });
    return;
  }

  if (nodeEnv === 'production') {
    checks.push({
      name: 'NODE_ENV',
      status: 'pass',
      message: 'NODE_ENV is set to production',
    });
  } else {
    checks.push({
      name: 'NODE_ENV',
      status: 'warning',
      message: `NODE_ENV is set to ${nodeEnv} (should be 'production' in production)`,
    });
  }
}

// Check database URLs
function checkDatabaseUrls() {
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (!dbUrl) {
    checks.push({
      name: 'DATABASE_URL',
      status: 'fail',
      message: 'DATABASE_URL is not set',
    });
  } else {
    // Check if using SSL
    if (!dbUrl.includes('sslmode=') && !dbUrl.includes('?ssl=true')) {
      checks.push({
        name: 'DATABASE_URL',
        status: 'warning',
        message: 'DATABASE_URL does not specify SSL mode (recommended for production)',
      });
    } else {
      checks.push({
        name: 'DATABASE_URL',
        status: 'pass',
        message: 'DATABASE_URL is set',
      });
    }
  }

  if (!directUrl) {
    checks.push({
      name: 'DIRECT_URL',
      status: 'fail',
      message: 'DIRECT_URL is not set',
    });
  } else {
    checks.push({
      name: 'DIRECT_URL',
      status: 'pass',
      message: 'DIRECT_URL is set',
    });
  }
}

// Check .env files are not committed
function checkEnvFiles() {
  try {
    const gitignore = readFileSync(resolve(process.cwd(), '.gitignore'), 'utf-8');
    if (!gitignore.includes('.env') && !gitignore.includes('.env.local')) {
      checks.push({
        name: '.gitignore',
        status: 'warning',
        message: '.env files may not be properly ignored in .gitignore',
      });
    } else {
      checks.push({
        name: '.gitignore',
        status: 'pass',
        message: '.env files are properly ignored',
      });
    }
  } catch {
    checks.push({
      name: '.gitignore',
      status: 'warning',
      message: 'Could not read .gitignore file',
    });
  }
}

// Check CORS configuration
function checkCors() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  if (!allowedOrigins) {
    checks.push({
      name: 'CORS',
      status: 'warning',
      message: 'ALLOWED_ORIGINS is not set (CORS will be restrictive)',
    });
  } else {
    checks.push({
      name: 'CORS',
      status: 'pass',
      message: `ALLOWED_ORIGINS is configured with ${allowedOrigins.split(',').length} origin(s)`,
    });
  }
}

// Run all checks
function runSecurityChecks() {
  console.log('🔒 Running security checks...\n');

  checkJwtSecret();
  checkNodeEnv();
  checkDatabaseUrls();
  checkEnvFiles();
  checkCors();

  // Display results
  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  checks.forEach((check) => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${check.name}: ${check.message}`);
    
    if (check.status === 'pass') passCount++;
    else if (check.status === 'fail') failCount++;
    else warnCount++;
  });

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Passed: ${passCount}`);
  console.log(`   ⚠️  Warnings: ${warnCount}`);
  console.log(`   ❌ Failed: ${failCount}`);

  if (failCount > 0) {
    console.log('\n❌ Security check failed. Please fix the issues above.');
    process.exit(1);
  } else if (warnCount > 0) {
    console.log('\n⚠️  Security check passed with warnings. Review the warnings above.');
    process.exit(0);
  } else {
    console.log('\n✨ All security checks passed!');
    process.exit(0);
  }
}

runSecurityChecks();
