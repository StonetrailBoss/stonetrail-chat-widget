import type { PoolConfig } from 'pg';

export function getDatabaseConfig(): PoolConfig {
  const connectionString = process.env.DATABASE_URL;
  // A missing URL is permitted at build time; a connection still fails at runtime.
  if (!connectionString && process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL must be configured');
  }
  return {
    connectionString: connectionString || 'postgresql://localhost:5432/stonetrail',
    max: 10,
    connectionTimeoutMillis: 10000,
    // Use Render's private URL internally; external URLs should use sslmode=verify-full.
    options: '-c timezone=UTC',
  };
}
