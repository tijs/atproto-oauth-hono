/**
 * Drizzle ORM storage adapter for ATProto OAuth sessions.
 *
 * This module provides Drizzle ORM integration for session storage, optimized for
 * Val.Town's sqlite2 environment. Import from this module only if you're using
 * Drizzle ORM to ensure drizzle-orm is only downloaded when needed.
 *
 * ## Required Schema
 * The {@link ironSessionStorageTable} table is required for session storage.
 * Create it in your database migrations.
 *
 * @example Val.Town setup with sqlite2
 * ```typescript
 * import { DrizzleStorage, ironSessionStorageTable } from "jsr:@tijs/atproto-oauth-hono@^0.2.7/drizzle";
 * import { drizzle } from "https://esm.sh/drizzle-orm@0.44.5/sqlite-proxy";
 * import { sqlite } from "https://esm.town/v/std/sqlite2";
 * import { createATProtoOAuth } from "jsr:@tijs/atproto-oauth-hono@^0.2.7";
 *
 * // Set up Drizzle with sqlite2 (Val.Town)
 * const db = drizzle(async (sql, params) => {
 *   const result = await sqlite.execute({ sql, args: params || [] });
 *   return { rows: result.rows };
 * });
 *
 * // Create required table (run once during setup)
 * await sqlite.execute({
 *   sql: `
 *     CREATE TABLE IF NOT EXISTS iron_session_storage (
 *       key TEXT PRIMARY KEY,
 *       value TEXT NOT NULL,
 *       expires_at INTEGER,
 *       created_at INTEGER NOT NULL,
 *       updated_at INTEGER NOT NULL
 *     )
 *   `,
 *   args: [],
 * });
 *
 * const storage = new DrizzleStorage(db);
 * const oauth = createATProtoOAuth({
 *   baseUrl: "https://myapp.val.run",
 *   cookieSecret: Deno.env.get("COOKIE_SECRET"),
 *   appName: "My App",
 *   sessionTtl: 60 * 60 * 24,
 *   storage,
 * });
 * ```
 *
 * @example Custom table name
 * ```typescript
 * const storage = new DrizzleStorage(db, {
 *   tableName: "custom_oauth_sessions"
 * });
 * ```
 *
 * @example Standard SQLite setup
 * ```typescript
 * import { DrizzleStorage } from "jsr:@tijs/atproto-oauth-hono/drizzle";
 * import { drizzle } from "npm:drizzle-orm@0.33.0/better-sqlite3";
 * import Database from "better-sqlite3";
 *
 * const sqlite = new Database("oauth.db");
 * const db = drizzle(sqlite);
 * const storage = new DrizzleStorage(db);
 * ```
 *
 * @module
 */

export { DrizzleStorage } from "./src/storage/drizzle.ts";
export { ironSessionStorageTable } from "./src/storage/schema.ts";
