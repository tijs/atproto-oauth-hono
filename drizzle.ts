/**
 * Drizzle ORM specific exports for ATProto OAuth storage.
 *
 * Import from this module only if you're using Drizzle ORM.
 * This ensures drizzle-orm is only downloaded when actually needed.
 *
 * @example Usage with Drizzle
 * ```typescript
 * import { DrizzleStorage, ironSessionStorageTable } from "jsr:@tijs/atproto-oauth-hono/drizzle";
 * import { drizzle } from "npm:drizzle-orm@0.33.0/better-sqlite3";
 *
 * const db = drizzle(sqlite);
 * const storage = new DrizzleStorage(db);
 * const oauth = createATProtoOAuth({
 *   baseUrl: "https://myapp.val.town",
 *   appName: "My App",
 *   storage,
 * });
 * ```
 *
 * @module
 */

export { DrizzleStorage } from "./src/storage/drizzle.ts";
export { ironSessionStorageTable } from "./src/storage/schema.ts";
