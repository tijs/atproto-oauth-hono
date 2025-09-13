/**
 * @fileoverview Complete ATProto OAuth integration for Hono applications
 *
 * Provides plug-and-play ATProto OAuth authentication with:
 * - Web and mobile OAuth flows
 * - Session management with automatic token refresh
 * - Pluggable storage (Memory, SQLite included; Drizzle via separate import)
 * - Configurable client metadata
 */

export { createATProtoOAuth } from "./src/oauth-factory.ts";
export type {
  ATProtoOAuthConfig,
  ATProtoOAuthInstance,
  ClientMetadata,
} from "./src/types.ts";

// Core storage implementations (no external dependencies)
export { MemoryStorage } from "./src/storage/memory.ts";
export { SQLiteStorage } from "./src/storage/sqlite.ts";
export type { OAuthStorage } from "./src/storage/interface.ts";

// Drizzle storage and schema (requires drizzle-orm to be installed separately)
// Import these only if you're using Drizzle ORM
// export { DrizzleStorage } from "./src/storage/drizzle.ts";
// export { ironSessionStorageTable } from "./src/storage/schema.ts";
