/**
 * Raw SQLite storage implementation for OAuth sessions
 * Works with Val.Town sqlite or any raw SQLite interface
 */

import type { OAuthStorage } from "./interface.ts";

// SQLite interface - compatible with Val.Town sqlite
export interface SQLiteDatabase {
  execute(
    query: { sql: string; args: any[] },
  ): Promise<{ columns: string[]; rows: any[][] }>;
}

/**
 * Raw SQLite storage for OAuth sessions and tokens
 */
export class SQLiteStorage implements OAuthStorage {
  private initialized = false;
  private tableName = "iron_session_storage";

  constructor(private db: SQLiteDatabase) {}

  private async init() {
    if (this.initialized) return;

    // Create table if it doesn't exist
    await this.db.execute({
      sql: `
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          expires_at INTEGER,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `,
      args: [],
    });

    // Create index on expires_at for efficient cleanup
    await this.db.execute({
      sql:
        `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_expires_at ON ${this.tableName}(expires_at)`,
      args: [],
    });

    this.initialized = true;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    await this.init();

    const now = Date.now();
    const result = await this.db.execute({
      sql: `
        SELECT value FROM ${this.tableName}
        WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)
        LIMIT 1
      `,
      args: [key, now],
    });

    if (result.rows.length === 0) {
      return null;
    }

    try {
      const value = result.rows[0][0];
      return JSON.parse(value) as T;
    } catch {
      return result.rows[0][0] as T;
    }
  }

  async set<T = unknown>(
    key: string,
    value: T,
    options?: { ttl?: number },
  ): Promise<void> {
    await this.init();

    const now = Date.now();
    const expiresAt = options?.ttl ? now + (options.ttl * 1000) : null;
    const serializedValue = typeof value === "string"
      ? value
      : JSON.stringify(value);

    await this.db.execute({
      sql: `
        INSERT INTO ${this.tableName} (key, value, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          expires_at = excluded.expires_at,
          updated_at = excluded.updated_at
      `,
      args: [key, serializedValue, expiresAt, now, now],
    });
  }

  async delete(key: string): Promise<void> {
    await this.init();

    await this.db.execute({
      sql: `DELETE FROM ${this.tableName} WHERE key = ?`,
      args: [key],
    });
  }
}
