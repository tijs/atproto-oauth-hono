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
          expires_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `,
      args: [],
    });

    // Migrate existing INTEGER timestamps to TEXT
    // This handles databases created with the old schema
    try {
      // Check if we have any rows with INTEGER timestamps
      const checkResult = await this.db.execute({
        sql:
          `SELECT key, expires_at, created_at, updated_at FROM ${this.tableName} LIMIT 1`,
        args: [],
      });

      if (checkResult.rows.length > 0) {
        const expiresAt = checkResult.rows[0][1];
        // If expires_at is a number (not a string starting with a digit), migrate all rows
        if (typeof expiresAt === "number") {
          console.log(
            "[SQLiteStorage] Migrating INTEGER timestamps to TEXT format...",
          );

          // Update all rows to convert INTEGER to TEXT
          await this.db.execute({
            sql: `
              UPDATE ${this.tableName}
              SET
                expires_at = CAST(expires_at AS TEXT),
                created_at = CAST(created_at AS TEXT),
                updated_at = CAST(updated_at AS TEXT)
            `,
            args: [],
          });

          console.log("[SQLiteStorage] ✅ Migration completed");
        }
      }
    } catch (err) {
      // Migration might fail on some SQLite implementations, that's ok
      console.log(
        "[SQLiteStorage] Migration skipped (not needed or not supported):",
        err,
      );
    }

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
    console.log("[SQLiteStorage.get]", {
      key,
      now,
      nowDate: new Date(now).toISOString(),
    });

    const result = await this.db.execute({
      sql: `
        SELECT value, expires_at FROM ${this.tableName}
        WHERE key = ?
        LIMIT 1
      `,
      args: [key],
    });

    console.log("[SQLiteStorage.get] All matching rows:", result.rows);

    if (result.rows.length === 0) {
      console.log("[SQLiteStorage.get] ❌ Key not found in database");
      return null;
    }

    // Parse expires_at from TEXT to number
    const expiresAtRaw = result.rows[0][1];
    const expiresAt = expiresAtRaw !== null
      ? parseInt(expiresAtRaw as string, 10)
      : null;

    console.log("[SQLiteStorage.get] Row found:", {
      expiresAtRaw,
      expiresAt,
      expiresAtDate: expiresAt ? new Date(expiresAt).toISOString() : null,
      isExpired: expiresAt !== null && expiresAt <= now,
    });

    // Check expiration
    if (expiresAt !== null && expiresAt <= now) {
      console.log("[SQLiteStorage.get] ❌ Key expired");
      return null;
    }

    try {
      const value = result.rows[0][0];
      const parsed = JSON.parse(value) as T;
      console.log("[SQLiteStorage.get] ✅ Returning value");
      return parsed;
    } catch {
      console.log("[SQLiteStorage.get] ✅ Returning raw value (not JSON)");
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

    console.log("[SQLiteStorage.set]", {
      key,
      ttl: options?.ttl,
      now,
      nowDate: new Date(now).toISOString(),
      expiresAt,
      expiresAtDate: expiresAt ? new Date(expiresAt).toISOString() : null,
    });

    await this.db.execute({
      sql: `
        INSERT INTO ${this.tableName} (key, value, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          expires_at = excluded.expires_at,
          updated_at = excluded.updated_at
      `,
      args: [
        key,
        serializedValue,
        expiresAt !== null ? expiresAt.toString() : null,
        now.toString(),
        now.toString(),
      ],
    });

    console.log("[SQLiteStorage.set] ✅ Stored successfully");
  }

  async delete(key: string): Promise<void> {
    await this.init();

    await this.db.execute({
      sql: `DELETE FROM ${this.tableName} WHERE key = ?`,
      args: [key],
    });
  }
}
