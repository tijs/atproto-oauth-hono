import type { Hono } from "@hono/hono";
import type { OAuthStorage } from "./storage/interface.ts";
import type { Logger, OAuthSessionsInterface } from "@tijs/hono-oauth-sessions";

/**
 * Configuration options for ATProto OAuth integration.
 *
 * This interface defines all the configuration options needed to set up
 * OAuth authentication with AT Protocol (Bluesky) in your Hono application.
 *
 * @example Basic configuration
 * ```typescript
 * const config: ATProtoOAuthConfig = {
 *   baseUrl: "https://myapp.val.run",
 *   appName: "My App",
 *   cookieSecret: Deno.env.get("COOKIE_SECRET"),
 *   sessionTtl: 60 * 60 * 24, // 24 hours
 * };
 * ```
 */
export interface ATProtoOAuthConfig {
  /** Base URL of your application (e.g. "https://myapp.val.town") */
  baseUrl: string;

  /** Display name for OAuth consent screen */
  appName: string;

  /** Custom URL scheme for mobile app callbacks (default: "app://auth-callback") */
  mobileScheme?: string;

  /** URL to app logo for OAuth consent screen */
  logoUri?: string;

  /** URL to privacy policy */
  policyUri?: string;

  /** Cookie signing secret (defaults to COOKIE_SECRET env var) */
  cookieSecret?: string;

  /** OAuth scope (default: "atproto transition:generic") */
  scope?: string;

  /**
   * Session TTL in seconds (default: 7 days). For mobile apps, consider 30+ days.
   *
   * **Important**: This field is required to prevent "option maxAge is invalid" errors.
   * Common values: 3600 (1 hour), 86400 (24 hours), 604800 (7 days)
   */
  sessionTtl?: number;

  /** Storage implementation for OAuth sessions (optional) */
  storage?: OAuthStorage;

  /**
   * Optional logger for debugging and monitoring OAuth flows.
   * Defaults to a no-op logger (no console output).
   * Pass console for standard logging or implement custom Logger interface.
   *
   * @example Enable console logging
   * ```typescript
   * logger: console
   * ```
   *
   * @example Custom logger
   * ```typescript
   * logger: {
   *   log: (...args) => myLogger.debug(...args),
   *   warn: (...args) => myLogger.warn(...args),
   *   error: (...args) => myLogger.error(...args),
   * }
   * ```
   */
  logger?: Logger;
}

/**
 * ATProto OAuth client metadata for /.well-known/oauth-client
 */
export interface ClientMetadata {
  client_name: string;
  client_id: string;
  client_uri: string;
  redirect_uris: string[];
  scope: string;
  grant_types: string[];
  response_types: string[];
  application_type: string;
  token_endpoint_auth_method: string;
  dpop_bound_access_tokens: boolean;
  logo_uri?: string;
  policy_uri?: string;
}

/**
 * Session validation result
 */
export interface SessionValidationResult {
  valid: boolean;
  did?: string;
  handle?: string;
  userHandle?: string;
  displayName?: string;
  avatar?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * Mobile OAuth start request
 */
export interface MobileOAuthStartRequest {
  handle: string;
  code_challenge: string;
}

/**
 * Mobile OAuth start response
 */
export interface MobileOAuthStartResponse {
  success: boolean;
  authUrl?: string;
  error?: string;
}

/**
 * ATProto OAuth instance returned by {@link createATProtoOAuth}.
 *
 * This object contains all the components needed for OAuth authentication:
 * - Pre-configured Hono routes for the OAuth flow
 * - Session validation utilities
 * - Client metadata generation
 * - Direct access to the sessions interface
 *
 * @example Using the OAuth instance
 * ```typescript
 * const oauth = createATProtoOAuth(config);
 *
 * // Mount the OAuth routes
 * app.route("/", oauth.routes);
 *
 * // Use session management
 * const session = await oauth.sessions.getOAuthSession(userDid);
 * if (session) {
 *   const response = await session.makeRequest("GET", "...");
 * }
 * ```
 */
export interface ATProtoOAuthInstance {
  /**
   * Hono app with all OAuth routes mounted.
   *
   * **Note**: TypeScript may show "Type instantiation is excessively deep" errors
   * when mounting routes. Add `// @ts-ignore` before `app.route("/", oauth.routes)`
   * if needed - it works correctly at runtime.
   */
  routes: Hono;

  /** Validate a session (web or mobile) */
  validateSession: (request: Request) => Promise<SessionValidationResult>;

  /** Generate client metadata */
  getClientMetadata: () => ClientMetadata;

  /** Direct access to sessions instance for advanced usage */
  sessions: OAuthSessionsInterface;
}
