#!/usr/bin/env tsx
/**
 * Health check script
 * Checks if the database is accessible and Prisma client is working
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

import { prisma } from '../prisma/db';

async function healthCheck() {
  console.log('🏥 Running health checks...\n');

  try {
    // Check database connection
    console.log('1️⃣  Checking database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connection successful');

    // Check if we can query the database
    console.log('\n2️⃣  Testing database query...');
    const userCount = await prisma.user.count();
    console.log(`   ✅ Database query successful (${userCount} users found)`);

    // Check Prisma client
    console.log('\n3️⃣  Verifying Prisma client...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('   ✅ Prisma client is working correctly');

    console.log('\n✨ All health checks passed!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Health check failed:');
    console.error(error);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

healthCheck();

