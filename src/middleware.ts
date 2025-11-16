/**
 * Optional Hono middleware for authentication
 *
 * Provides reusable middleware for common authentication patterns.
 * Use these to simplify route handlers and get type-safe access to OAuth sessions.
 *
 * @module
 */

import type { Context, Next } from "@hono/hono";
import type { OAuthSessionsInterface } from "@tijs/hono-oauth-sessions";

/**
 * Create authentication middleware that requires a valid OAuth session.
 *
 * This middleware:
 * 1. Extracts and validates the OAuth session from the request
 * 2. Returns 401 if session is invalid or expired
 * 3. Sets session in Hono context for downstream handlers
 * 4. Automatically clears invalid session cookies
 *
 * @param sessions - OAuth sessions manager instance
 * @returns Hono middleware function
 *
 * @example Basic usage
 * ```typescript
 * import { createATProtoOAuth, createAuthMiddleware } from "jsr:@tijs/atproto-oauth-hono";
 *
 * const oauth = createATProtoOAuth({...});
 * const requireAuth = createAuthMiddleware(oauth.sessions);
 *
 * app.post("/api/bookmarks", requireAuth, async (c) => {
 *   const session = c.get("oauthSession");
 *   // session is guaranteed to exist and be valid here
 *   const response = await session.makeRequest("POST", `${session.pdsUrl}/xrpc/...`);
 *   return c.json(await response.json());
 * });
 * ```
 *
 * @example With typed context
 * ```typescript
 * import type { SessionInterface } from "jsr:@tijs/hono-oauth-sessions";
 *
 * type Variables = {
 *   oauthSession: SessionInterface;
 *   userDid: string;
 * };
 *
 * const app = new Hono<{ Variables: Variables }>();
 * const requireAuth = createAuthMiddleware(oauth.sessions);
 *
 * app.post("/api/protected", requireAuth, async (c) => {
 *   const session = c.get("oauthSession"); // Type-safe!
 *   const did = c.get("userDid"); // Type-safe!
 *   // ...
 * });
 * ```
 *
 * @example Custom error response
 * ```typescript
 * // You can customize the error response by wrapping the middleware
 * const requireAuth = async (c: Context, next: Next) => {
 *   const session = await oauth.sessions.getOAuthSessionFromRequest(c.req.raw);
 *   if (!session) {
 *     return c.json(
 *       { error: "Please log in", redirect: "/login" },
 *       401,
 *       { headers: { "Set-Cookie": oauth.sessions.getClearCookieHeader() } }
 *     );
 *   }
 *   c.set("oauthSession", session);
 *   await next();
 * };
 * ```
 */
export function createAuthMiddleware(
  sessions: OAuthSessionsInterface,
): (c: Context, next: Next) => Promise<Response | void> {
  return async (c: Context, next: Next) => {
    // Extract and validate session from request (handles both web cookies and mobile Bearer tokens)
    const session = await sessions.getOAuthSessionFromRequest(c.req.raw);

    if (!session) {
      // Return 401 and clear invalid session cookie
      return c.json(
        {
          error: "Authentication required",
          message: "Please log in again",
          code: "SESSION_EXPIRED",
        },
        401,
        {
          headers: {
            "Set-Cookie": sessions.getClearCookieHeader(),
          },
        },
      );
    }

    // Store session in context for downstream handlers
    c.set("oauthSession", session);
    c.set("userDid", session.did);

    await next();
  };
}
