/**
 * Main factory function for creating ATProto OAuth integration
 */

import type { ATProtoOAuthConfig, ATProtoOAuthInstance, ProfileData } from "./types.ts";
import { createOAuthRoutes } from "./oauth-routes.ts";
import { MemoryStorage } from "./storage/memory.ts";
import { generateClientMetadata } from "./client-metadata.ts";

/**
 * Create a complete ATProto OAuth integration for Hono applications.
 *
 * This function sets up everything needed for ATProto/Bluesky OAuth authentication,
 * including automatic routes for login, logout, and session management.
 *
 * @param config - Configuration object for OAuth integration
 * @returns ATProto OAuth instance with routes and session management
 *
 * @example Basic setup for Val.Town
 * ```typescript
 * import { createATProtoOAuth } from "jsr:@tijs/atproto-oauth-hono";
 * import { DrizzleStorage } from "jsr:@tijs/atproto-oauth-hono/drizzle";
 * import { Hono } from "https://esm.sh/hono";
 *
 * const app = new Hono();
 *
 * const oauth = createATProtoOAuth({
 *   baseUrl: "https://myapp.val.run",
 *   cookieSecret: Deno.env.get("COOKIE_SECRET"),
 *   appName: "My App",
 *   sessionTtl: 60 * 60 * 24, // 24 hours
 *   storage: new DrizzleStorage(db),
 * });
 *
 * // Mount OAuth routes (handles /login, /logout, /oauth/callback, etc.)
 * app.route("/", oauth.routes);
 * ```
 *
 * @example Check authentication in your routes
 * ```typescript
 * app.get("/api/protected", async (c) => {
 *   const authResult = await getAuthenticatedUser(c);
 *   if (!authResult) {
 *     return c.json({ error: "Authentication required" }, 401);
 *   }
 *
 *   const { did, oauthSession } = authResult;
 *   // Use oauthSession.makeRequest() for authenticated API calls
 *   const response = await oauthSession.makeRequest("GET", `${oauthSession.pdsUrl}/xrpc/...`);
 *   return c.json(await response.json());
 * });
 * ```
 *
 * @example Memory storage for development
 * ```typescript
 * const oauth = createATProtoOAuth({
 *   baseUrl: "https://myapp.val.run",
 *   cookieSecret: "dev-secret",
 *   appName: "My Dev App",
 *   // No storage specified - uses MemoryStorage by default
 * });
 * ```
 */
export function createATProtoOAuth(
  config: ATProtoOAuthConfig,
): ATProtoOAuthInstance {
  // Validate required config
  if (!config.baseUrl) {
    throw new Error("baseUrl is required");
  }
  if (!config.appName) {
    throw new Error("appName is required");
  }

  // Normalize baseUrl
  const normalizedConfig = {
    ...config,
    baseUrl: config.baseUrl.replace(/\/$/, ""),
  };

  // Use provided storage or fallback to memory storage (for testing/development)
  const storage = config.storage || new MemoryStorage();

  // Create OAuth routes with storage
  const { routes, validateSession, sessions } = createOAuthRoutes(
    normalizedConfig,
    storage,
  );

  /**
   * Get AT Protocol profile data for a user
   */
  const getProfile = async (did: string): Promise<ProfileData | null> => {
    try {
      // Get OAuth session to make authenticated request
      const oauthSession = await sessions.getOAuthSession(did);
      if (!oauthSession) {
        return null;
      }

      // Fetch profile from user's PDS
      const response = await oauthSession.makeRequest(
        "GET",
        `${oauthSession.pdsUrl}/xrpc/app.bsky.actor.getProfile?actor=${did}`,
      );

      if (!response.ok) {
        console.error(`Profile fetch failed with status: ${response.status}`);
        return null;
      }

      const profile = await response.json();

      return {
        did: profile.did,
        handle: profile.handle,
        displayName: profile.displayName,
        description: profile.description,
        avatar: profile.avatar,
        banner: profile.banner,
        followsCount: profile.followsCount,
        followersCount: profile.followersCount,
        postsCount: profile.postsCount,
        indexedAt: profile.indexedAt,
        labels: profile.labels,
      };
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      return null;
    }
  };

  return {
    routes,
    validateSession,
    getClientMetadata: () => generateClientMetadata(normalizedConfig),
    getProfile,
    sessions,
  };
}
