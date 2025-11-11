#!/usr/bin/env tsx
/**
 * Database reset script
 * Resets the database, runs migrations, and optionally seeds data
 */

// Load environment variables from .env files
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

const envPath = resolve(process.cwd(), '.env');
const envLocalPath = resolve(process.cwd(), '.env.local');

// Load .env first, then .env.local (which overrides, matching Next.js behavior)
if (existsSync(envPath)) {
  config({ path: envPath });
}

// Load .env.local after .env (it will override .env values, like Next.js)
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
}

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const shouldSeed = args.includes('--seed') || args.includes('-s');
const shouldSkipMigrations = args.includes('--skip-migrations');

console.log('🔄 Resetting database...\n');

try {
  // Check if .env exists
  try {
    readFileSync('.env');
  } catch {
    console.error('❌ .env file not found!');
    process.exit(1);
  }

  if (!shouldSkipMigrations) {
    console.log('📦 Resetting database and running migrations...');
    execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
  } else {
    console.log('🗑️  Dropping database...');
    execSync('npx prisma migrate reset --skip-seed --force', { stdio: 'inherit' });
  }

  if (shouldSeed) {
    console.log('\n🌱 Seeding database...');
    try {
      execSync('npm run db:seed', { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️  Seeding failed or seed file does not exist. Skipping...');
    }
  }

  console.log('\n✅ Database reset complete!');
} catch (error) {
  console.error('\n❌ Database reset failed:', error);
  process.exit(1);
}

