/**
 * Environment variable validation and configuration
 * This module ensures all required environment variables are present
 * before the application starts.
 */

const requiredEnvVars = [
  'DATABASE_URL',
] as const;

const optionalEnvVars = [
  'PORT',
  'HOSTNAME',
  'NODE_ENV',
  'DB_CONNECTION_LIMIT',
  'DB_SSL',
  'DISABLE_IMAGE_OPTIMIZATION',
  'GOOGLE_GENAI_API_KEY', // For AI features
] as const;

type RequiredEnvVar = typeof requiredEnvVars[number];
type OptionalEnvVar = typeof optionalEnvVars[number];

interface EnvConfig {
  DATABASE_URL: string;
  PORT: number;
  HOSTNAME: string;
  NODE_ENV: 'development' | 'production' | 'test';
  DB_CONNECTION_LIMIT: number;
  DB_SSL: boolean;
  DISABLE_IMAGE_OPTIMIZATION: boolean;
  GOOGLE_GENAI_API_KEY?: string;
}

class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

/**
 * Validates that all required environment variables are set
 */
export function validateEnv(): void {
  const missing: string[] = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    throw new EnvironmentError(
      `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\nPlease check your .env file or environment configuration.`
    );
  }
}

/**
 * Get typed environment configuration
 */
export function getEnvConfig(): EnvConfig {
  validateEnv();
  
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    PORT: parseInt(process.env.PORT || '3000', 10),
    HOSTNAME: process.env.HOSTNAME || '0.0.0.0',
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
    DB_CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT || '5', 10),
    DB_SSL: process.env.DB_SSL === 'true',
    DISABLE_IMAGE_OPTIMIZATION: process.env.DISABLE_IMAGE_OPTIMIZATION === 'true',
    GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY,
  };
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production';
}

// Validate on module load in server context
if (typeof window === 'undefined') {
  try {
    validateEnv();
  } catch (error) {
    // Only log in development, throw in production
    if (process.env.NODE_ENV === 'production') {
      throw error;
    } else {
      console.warn('Environment validation warning:', (error as Error).message);
    }
  }
}
