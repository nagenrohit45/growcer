import pg from "pg";

export async function createDatabase() {
  if (process.env.DATABASE_URL)
    return new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
    });
  if (
    process.env.GROWCER_TEST_DB === "memory" &&
    process.env.NODE_ENV !== "production" &&
    !process.env.VERCEL
  ) {
    const { newDb } = await import("pg-mem");
    const memory = newDb();
    return new (memory.adapters.createPg().Pool)();
  }
  throw new Error(
    "DATABASE_URL is not configured. Connect a PostgreSQL database before using accounts or checkout.",
  );
}

export async function initializeDatabase(db) {
  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
    password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at TIMESTAMPTZ NOT NULL
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), request_key TEXT NOT NULL,
    payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, request_key)
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS auth_attempts (
    key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at TIMESTAMPTZ NOT NULL
  )`);
}
