#!/usr/bin/env tsx
/**
 * Environment variables checker
 * Verifies that all required environment variables are set
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

const requiredEnvVars = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET',
];

const optionalEnvVars = [
  'NODE_ENV',
  'NEXT_PUBLIC_APP_URL',
];

function checkEnv() {
  console.log('🔍 Checking environment variables...\n');
  
  const missing: string[] = [];
  const present: string[] = [];
  const optional: string[] = [];

  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      present.push(varName);
    }
  });

  optionalEnvVars.forEach((varName) => {
    if (process.env[varName]) {
      optional.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Make sure your .env or .env.local file is set up correctly.');
    console.error('   Note: .env.local takes precedence over .env (matching Next.js behavior).');
    
    if (missing.includes('JWT_SECRET')) {
      console.error('\n🔑 To generate a JWT_SECRET, you can run:');
      console.error('   npm run generate:jwt-secret');
      console.error('   or: openssl rand -base64 32');
      console.error('   Add it to your .env.local file as: JWT_SECRET="your-secret-here"');
    }
    
    process.exit(1);
  }

  console.log('✅ All required environment variables are set:');
  present.forEach((varName) => {
    const value = process.env[varName];
    // Hide sensitive values
    const displayValue = varName.includes('SECRET') || varName.includes('PASSWORD') || varName.includes('URL')
      ? `${value?.substring(0, 20)}...` 
      : value;
    console.log(`   ✓ ${varName}=${displayValue}`);
  });

  if (optional.length > 0) {
    console.log('\n📝 Optional environment variables set:');
    optional.forEach((varName) => {
      console.log(`   • ${varName}`);
    });
  }

  console.log('\n✨ Environment check passed!');
  process.exit(0);
}

checkEnv();

