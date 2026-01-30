/**
 * Environment Variables Validator
 * Validates required environment variables at startup
 */

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET',
] as const;

// Optional environment variables (documented but not required)
// NODE_ENV, NEXT_PUBLIC_APP_URL, ALLOWED_ORIGINS

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validate environment variables
 */
export function validateEnvVars(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Validate JWT_SECRET strength if present
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    if (jwtSecret.length < 32) {
      warnings.push('JWT_SECRET should be at least 32 characters long');
    }
    if (jwtSecret === 'your-secret-key-here' || jwtSecret === 'secret') {
      warnings.push('JWT_SECRET appears to be a default/weak value');
    }
  }

  // Validate NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
    warnings.push(`NODE_ENV has unexpected value: ${nodeEnv}`);
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Validate and throw if invalid (for startup)
 */
export function validateEnvVarsOrThrow(): void {
  const result = validateEnvVars();
  
  if (!result.valid) {
    throw new Error(
      `Missing required environment variables: ${result.missing.join(', ')}\n` +
      'Please check your .env or .env.local file.'
    );
  }

  if (result.warnings.length > 0 && process.env.NODE_ENV === 'production') {
    // Em produção, warnings são críticos
    console.warn('Environment variable warnings:', result.warnings);
  }
}
