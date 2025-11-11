#!/usr/bin/env tsx
/**
 * Generate JWT Secret
 * Generates a secure random JWT secret for use in .env file
 */

import { randomBytes } from 'crypto';

function generateJWTSecret() {
  // Generate a 32-byte (256-bit) random secret
  const secret = randomBytes(32).toString('base64');
  
  console.log('🔑 Generated JWT Secret:\n');
  console.log(`JWT_SECRET="${secret}"\n`);
  console.log('💡 Copy the above line and add it to your .env file.');
  console.log('   Make sure to keep this secret secure and never commit it to git!\n');
}

generateJWTSecret();

