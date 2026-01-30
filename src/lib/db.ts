import mysql from 'mysql2/promise';

declare global {
  // Allow global `var` declarations
  // for storing the connection pool
  var dbPool: mysql.Pool | undefined;
}

// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set. Please configure your database connection.');
}

// Parse database URL for better error handling and SSL support
const createPoolConfig = (): mysql.PoolOptions => {
  const dbUrl = process.env.DATABASE_URL!;
  
  // Base configuration
  const config: mysql.PoolOptions = {
    uri: dbUrl,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '5', 10), // Lower limit for shared hosting
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000, // 10 seconds
    connectTimeout: 30000, // 30 seconds timeout for cPanel
    maxIdle: 3, // Maximum idle connections (for mysql2 3.x+)
    idleTimeout: 60000, // Close idle connections after 60 seconds
  };

  // Add timezone setting if not in URL
  if (!dbUrl.includes('timezone')) {
    config.timezone = 'Z'; // UTC
  }

  // Enable SSL for production if database supports it
  if (process.env.NODE_ENV === 'production' && process.env.DB_SSL === 'true') {
    config.ssl = {
      rejectUnauthorized: false, // For self-signed certificates common in cPanel
    };
  }

  return config;
};

// Create connection pool with error handling
const createPool = (): mysql.Pool => {
  try {
    return mysql.createPool(createPoolConfig());
  } catch (error) {
    console.error('Failed to create database pool:', error);
    throw error;
  }
};

// Use global pool in development to prevent connection exhaustion during HMR
// In production, also use global pool to prevent multiple pool instances
const pool = globalThis.dbPool || createPool();

// Store globally to prevent creating multiple pools
if (!globalThis.dbPool) {
  globalThis.dbPool = pool;
}

// Graceful shutdown handler for cPanel/PM2 deployments
const handleShutdown = async () => {
  if (globalThis.dbPool) {
    console.log('Closing database connection pool...');
    try {
      await globalThis.dbPool.end();
      console.log('Database pool closed successfully.');
    } catch (error) {
      console.error('Error closing database pool:', error);
    }
  }
};

// Register shutdown handlers (only once)
if (typeof process !== 'undefined' && !process.env.__DB_SHUTDOWN_REGISTERED) {
  process.env.__DB_SHUTDOWN_REGISTERED = 'true';
  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

// Health check function for monitoring
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

export default pool;
