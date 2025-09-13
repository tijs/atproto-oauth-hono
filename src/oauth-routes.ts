/**
 * OAuth route handlers for ATProto authentication
 * Adapted from location-feed-generator/backend/routes/oauth.ts
 */

import { Hono } from "@hono/hono";
import { OAuthClient } from "@tijs/oauth-client-deno";
import { HonoOAuthSessions } from "@tijs/hono-oauth-sessions";
import type {
  ATProtoOAuthConfig,
  MobileOAuthStartRequest,
  MobileOAuthStartResponse,
  SessionValidationResult,
} from "./types.ts";
import type { OAuthStorage } from "./storage/interface.ts";
import { generateClientMetadata } from "./client-metadata.ts";

/**
 * Create OAuth routes for ATProto authentication
 */
export function createOAuthRoutes(
  config: ATProtoOAuthConfig,
  storage: OAuthStorage,
): {
  routes: Hono;
  validateSession: (request: Request) => Promise<SessionValidationResult>;
  sessions: any;
} {
  const app = new Hono();
  const baseUrl = config.baseUrl.replace(/\/$/, "");

  const cookieSecret = config.cookieSecret ||
    (typeof Deno !== "undefined" ? Deno.env.get("COOKIE_SECRET") : undefined) ||
    "default-secret-for-development-only";

  // Create OAuth client and sessions manager
  const oauthClient = new OAuthClient({
    clientId: `${baseUrl}/client-metadata.json`,
    redirectUri: `${baseUrl}/oauth/callback`,
    storage,
  });

  const sessions = new HonoOAuthSessions({
    oauthClient,
    storage,
    cookieSecret,
    baseUrl,
    mobileScheme: config.mobileScheme || "app://auth-callback",
  });

  const clientMetadata = generateClientMetadata(config);

  // OAuth client metadata
  app.get("/client-metadata.json", (c) => {
    return c.json(clientMetadata);
  });

  // Start OAuth flow (web)
  app.get("/login", async (c) => {
    const { handle } = c.req.query();

    if (typeof handle !== "string") {
      return c.text("Invalid handle", 400);
    }

    try {
      const authUrl = await sessions.startOAuth(handle);
      return c.redirect(authUrl);
    } catch (err) {
      console.error("OAuth authorize failed:", err);
      return c.text(
        err instanceof Error ? err.message : "Couldn't initiate login",
        400,
      );
    }
  });

  // OAuth callback
  app.get("/oauth/callback", async (c) => {
    try {
      return await sessions.handleCallback(c);
    } catch (err) {
      console.error("OAuth callback failed:", err);
      return c.text(`Login failed: ${(err as Error).message}`, 400);
    }
  });

  // Mobile OAuth start
  app.post("/api/auth/mobile-start", async (c) => {
    try {
      const body: MobileOAuthStartRequest = await c.req.json();
      const { handle, code_challenge } = body;

      if (typeof handle !== "string") {
        return c.json({ error: "Invalid handle" }, 400);
      }

      if (typeof code_challenge !== "string") {
        return c.json({ error: "Missing code_challenge" }, 400);
      }

      console.log(`Starting mobile OAuth authorize for handle: ${handle}`);

      const authUrl = await sessions.startOAuth(handle, {
        mobile: true,
        codeChallenge: code_challenge,
      });

      console.log(`Generated mobile authorization URL: ${authUrl}`);

      const response: MobileOAuthStartResponse = {
        success: true,
        authUrl: authUrl,
      };

      return c.json(response);
    } catch (err) {
      console.error("Mobile OAuth start failed:", err);
      const response: MobileOAuthStartResponse = {
        success: false,
        error: err instanceof Error ? err.message : "Couldn't initiate login",
      };
      return c.json(response, 400);
    }
  });

  // Mobile token refresh
  app.get("/mobile/refresh-token", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      if (!authHeader) {
        return c.json(
          { success: false, error: "Missing Authorization header" },
          401,
        );
      }

      const result = await sessions.refreshMobileToken(authHeader);
      return c.json(result);
    } catch (err) {
      console.error("Token refresh failed:", err);
      return c.json({ success: false, error: "Token refresh failed" }, 500);
    }
  });

  // Session validation
  app.get("/validate-session", async (c) => {
    try {
      const result = await sessions.validateSession(c);
      if (result.valid) {
        return c.json({
          valid: true,
          did: result.did,
          handle: result.handle,
        });
      } else {
        return c.json({ valid: false }, 401);
      }
    } catch (err) {
      console.error("Session validation failed:", err);
      return c.json({ valid: false }, 401);
    }
  });

  // Session validation for API (extended)
  app.get("/api/auth/session", async (c) => {
    try {
      let result;

      // Check if request has Authorization header (mobile) or uses cookies (web)
      const authHeader = c.req.header("Authorization");

      if (authHeader && authHeader.startsWith("Bearer ")) {
        // Mobile client with Bearer token
        console.log("Using mobile session validation for Bearer token");
        result = await sessions.validateMobileSession(authHeader);
      } else {
        // Web client with cookies
        console.log("Using cookie-based session validation");
        result = await sessions.validateSession(c);
      }

      if (!result.valid || !result.did) {
        return c.json({ valid: false }, 401);
      }

      // Get additional OAuth session data for API access
      const oauthData = await sessions.getStoredOAuthData(result.did);
      if (!oauthData) {
        return c.json({ valid: false }, 401);
      }

      const sessionResult: SessionValidationResult = {
        valid: true,
        did: result.did,
        handle: result.handle || oauthData.handle,
        userHandle: result.handle || oauthData.handle, // Add userHandle for mobile client compatibility
        displayName: result.displayName || oauthData.displayName,
        avatar: oauthData.avatar,
        accessToken: oauthData.accessToken,
        refreshToken: oauthData.refreshToken,
        expiresAt: oauthData.expiresAt,
      };

      return c.json(sessionResult);
    } catch (err) {
      console.error("Session validation failed:", err);
      return c.json({ valid: false }, 401);
    }
  });

  // Logout
  app.post("/api/auth/logout", async (c) => {
    try {
      await sessions.logout(c);
      return c.json({ success: true });
    } catch (err) {
      console.error("Logout failed:", err);
      return c.json({ success: false, error: "Logout failed" }, 500);
    }
  });

  // Session validation helper function
  const validateSession = async (
    request: Request,
  ): Promise<SessionValidationResult> => {
    try {
      const authHeader = request.headers.get("Authorization");
      let result;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        // Mobile session validation
        result = await sessions.validateMobileSession(authHeader);
      } else {
        // Web session validation - create a mock context for Hono
        const mockContext = {
          req: {
            raw: request,
          },
        } as Parameters<typeof sessions.validateSession>[0];
        result = await sessions.validateSession(mockContext);
      }

      if (!result.valid || !result.did) {
        return { valid: false };
      }

      // Get OAuth data
      const oauthData = await sessions.getStoredOAuthData(result.did);
      if (!oauthData) {
        return { valid: false };
      }

      return {
        valid: true,
        did: result.did,
        handle: result.handle || oauthData.handle,
        userHandle: result.handle || oauthData.handle,
        displayName: result.displayName || oauthData.displayName,
        avatar: oauthData.avatar,
        accessToken: oauthData.accessToken,
        refreshToken: oauthData.refreshToken,
        expiresAt: oauthData.expiresAt,
      };
    } catch (err) {
      console.error("Session validation failed:", err);
      return { valid: false };
    }
  };

  return { routes: app, validateSession, sessions };
}
