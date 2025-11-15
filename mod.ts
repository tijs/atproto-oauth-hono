/**
 * Complete ATProto OAuth integration for Hono applications on Val.Town and other platforms.
 *
 * This package provides everything needed for AT Protocol (Bluesky) OAuth authentication
 * in your Hono applications, with special focus on Val.Town compatibility:
 *
 * ## Features
 * - **Plug-and-play OAuth flows** - Web and mobile authentication
 * - **Cookie-based sessions** - Secure, encrypted session management
 * - **Automatic DPoP handling** - No manual token management needed
 * - **Multiple storage options** - Memory, SQLite, or Drizzle ORM
 * - **Val.Town optimized** - Works perfectly with sqlite2 and Drizzle
 * - **TypeScript support** - Full type safety and IntelliSense
 *
 * ## Quick Start (Val.Town)
 *
 * @example Complete Val.Town setup
 * ```typescript
 * import { Hono } from "https://esm.sh/hono";
 * import { createATProtoOAuth, SQLiteStorage } from "jsr:@tijs/atproto-oauth-hono@^2";
 * import { sqlite } from "https://esm.town/v/std/sqlite2";
 *
 * const app = new Hono();
 *
 * // Create OAuth instance with SQLiteStorage (recommended for Val.Town)
 * const oauth = createATProtoOAuth({
 *   baseUrl: "https://myapp.val.run",
 *   cookieSecret: Deno.env.get("COOKIE_SECRET"),
 *   appName: "My App",
 *   sessionTtl: 60 * 60 * 24, // 24 hours (in seconds)
 *   storage: new SQLiteStorage(sqlite), // Simple, reliable raw SQL storage
 * });
 *
 * // Mount OAuth routes (handles /login, /logout, /oauth/callback automatically)
 * app.route("/", oauth.routes);
 *
 * export default app.fetch;
 * ```
 *
 * @example Frontend integration
 * ```typescript
 * // Check authentication status
 * const response = await fetch("/api/auth/session", {
 *   credentials: "include", // Required for cookie-based auth
 * });
 * const data = await response.json();
 *
 * if (data.valid) {
 *   console.log("User DID:", data.did);
 *   console.log("Handle:", data.handle);
 * }
 *
 * // Login flow
 * globalThis.location.href = `/login?handle=${encodeURIComponent("user.bsky.social")}`;
 * ```
 *
 * @example Making authenticated requests
 * ```typescript
 * app.get("/api/user-posts", async (c) => {
 *   const authResult = await getAuthenticatedUser(c);
 *   if (!authResult) {
 *     return c.json({ error: "Authentication required" }, 401);
 *   }
 *
 *   const { did, oauthSession } = authResult;
 *
 *   // Package handles DPoP tokens automatically
 *   const response = await oauthSession.makeRequest(
 *     "GET",
 *     `${oauthSession.pdsUrl}/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=app.bsky.feed.post`
 *   );
 *
 *   return c.json(await response.json());
 * });
 * ```
 *
 * For complete API documentation with examples, visit:
 * https://jsr.io/@tijs/atproto-oauth-hono
 *
 * @module
 */

export { createATProtoOAuth } from "./src/oauth-factory.ts";
export type {
  ATProtoOAuthConfig,
  ATProtoOAuthInstance,
  ClientMetadata,
  ProfileData,
} from "./src/types.ts";

// Core storage implementations (no external dependencies)
export { MemoryStorage } from "./src/storage/memory.ts";
export { SQLiteStorage } from "./src/storage/sqlite.ts";
export type { OAuthStorage } from "./src/storage/interface.ts";

// Drizzle storage and schema (requires drizzle-orm to be installed separately)
// Import these only if you're using Drizzle ORM
// export { DrizzleStorage } from "./src/storage/drizzle.ts";
// export { ironSessionStorageTable } from "./src/storage/schema.ts";
