/**
 * Val.Town SQLite storage implementation for OAuth sessions
 * Adapted from location-feed-generator/backend/oauth/iron-storage.ts
 */

import type { OAuthStorage } from "./interface.ts";

// Note: These imports work on Val.Town but will need to be mocked for testing
declare const sqlite: {
  execute(
    query: { sql: string; args: any[] },
  ): Promise<{ columns: string[]; rows: any[][] }>;
};

/**
 * Val.Town SQLite storage for OAuth sessions and tokens
 */
export class ValTownStorage implements OAuthStorage {
  private initialized = false;
  private tableName = "iron_session_storage";

  private async init() {
    if (this.initialized) return;

    // Create table if it doesn't exist
    await sqlite.execute({
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
    await sqlite.execute({
      sql:
        `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_expires_at ON ${this.tableName}(expires_at)`,
      args: [],
    });

    this.initialized = true;
  }

  async hasItem(key: string): Promise<boolean> {
    await this.init();

    const now = Date.now();
    const result = await sqlite.execute({
      sql: `
        SELECT key FROM ${this.tableName}
        WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)
        LIMIT 1
      `,
      args: [key, now],
    });

    return result.rows.length > 0;
  }

  async getItem<T = any>(key: string): Promise<T | null> {
    await this.init();

    const now = Date.now();
    const result = await sqlite.execute({
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

  async setItem(
    key: string,
    value: any,
    options?: { ttl?: number },
  ): Promise<void> {
    await this.init();

    const now = Date.now();
    const expiresAt = options?.ttl ? now + (options.ttl * 1000) : null;
    const serializedValue = typeof value === "string"
      ? value
      : JSON.stringify(value);

    await sqlite.execute({
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

  async removeItem(key: string): Promise<void> {
    await this.init();

    await sqlite.execute({
      sql: `DELETE FROM ${this.tableName} WHERE key = ?`,
      args: [key],
    });
  }

  async getKeys(): Promise<string[]> {
    await this.init();

    const now = Date.now();
    const result = await sqlite.execute({
      sql: `
        SELECT key FROM ${this.tableName}
        WHERE expires_at IS NULL OR expires_at > ?
      `,
      args: [now],
    });

    return result.rows.map((row) => row[0]);
  }

  async clear(): Promise<void> {
    await this.init();

    await sqlite.execute({
      sql: `DELETE FROM ${this.tableName}`,
      args: [],
    });
  }

  async cleanup(): Promise<void> {
    await this.init();

    const now = Date.now();
    await sqlite.execute({
      sql: `
        DELETE FROM ${this.tableName}
        WHERE expires_at IS NOT NULL AND expires_at <= ?
      `,
      args: [now],
    });
  }

  // Aliases for OAuth client compatibility
  get = this.getItem;
  set = this.setItem;
  del = this.removeItem;
  delete = this.removeItem;
}

/**
 * Default Val.Town storage instance
 */
export const defaultValTownStorage = new ValTownStorage();
