/**
 * Drizzle-based storage implementation for OAuth sessions
 * Exactly matches location-feed-generator/backend/oauth/iron-storage.ts
 */

import type { OAuthStorage } from "./interface.ts";
import { ironSessionStorageTable } from "./schema.ts";
import { and, eq, gt, isNull, or } from "https://esm.sh/drizzle-orm@0.33.0";

// Database interface - compatible with Drizzle database instances
export interface DrizzleDatabase {
  select: (fields: any) => any;
  insert: (table: any) => any;
  delete: (table: any) => any;
}

/**
 * Drizzle-based storage for OAuth sessions and tokens
 * Matches location-feed-generator implementation exactly
 */
export class DrizzleStorage implements OAuthStorage {
  private initialized = false;

  constructor(private db: DrizzleDatabase) {}

  init() {
    if (this.initialized) return;
    // Table creation is handled by Drizzle migrations
    this.initialized = true;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    this.init();

    const now = Date.now();
    const result = await this.db.select({
      value: ironSessionStorageTable.value,
    })
      .from(ironSessionStorageTable)
      .where(
        and(
          eq(ironSessionStorageTable.key, key),
          // Either no expiration (null) or expires in the future
          or(
            isNull(ironSessionStorageTable.expiresAt),
            gt(ironSessionStorageTable.expiresAt, now),
          ),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    try {
      const value = result[0].value;
      return JSON.parse(value) as T;
    } catch {
      return result[0].value as T;
    }
  }

  async set<T = unknown>(
    key: string,
    value: T,
    options?: { ttl?: number },
  ): Promise<void> {
    this.init();

    const now = Date.now();
    const expiresAt = options?.ttl ? now + (options.ttl * 1000) : null;
    const serializedValue = typeof value === "string"
      ? value
      : JSON.stringify(value);

    await this.db.insert(ironSessionStorageTable)
      .values({
        key,
        value: serializedValue,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: ironSessionStorageTable.key,
        set: {
          value: serializedValue,
          expiresAt,
          updatedAt: now,
        },
      });
  }

  async delete(key: string): Promise<void> {
    this.init();

    await this.db.delete(ironSessionStorageTable)
      .where(eq(ironSessionStorageTable.key, key));
  }
}
