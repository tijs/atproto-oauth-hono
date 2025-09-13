/**
 * @fileoverview Drizzle ORM specific exports for @tijs/atproto-oauth-hono
 *
 * Import from this module only if you're using Drizzle ORM.
 * This ensures drizzle-orm is only downloaded when actually needed.
 *
 * @example
 * ```typescript
 * import { DrizzleStorage, ironSessionStorageTable } from "jsr:@tijs/atproto-oauth-hono/drizzle";
 * import { drizzle } from "https://esm.sh/drizzle-orm@0.33.0/better-sqlite3";
 *
 * const db = drizzle(sqlite);
 * const storage = new DrizzleStorage(db);
 * ```
 */

export { DrizzleStorage } from "./src/storage/drizzle.ts";
export { ironSessionStorageTable } from "./src/storage/schema.ts";
