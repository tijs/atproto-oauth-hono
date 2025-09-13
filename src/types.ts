import type { Hono } from "@hono/hono";
import type { OAuthStorage } from "./storage/interface.ts";

/**
 * Configuration for ATProto OAuth integration
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

  /** Storage implementation for OAuth sessions (optional) */
  storage?: OAuthStorage;
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
 * ATProto OAuth instance with routes
 */
export interface ATProtoOAuthInstance {
  /** Hono app with all OAuth routes mounted */
  routes: Hono;

  /** Validate a session (web or mobile) */
  validateSession: (request: Request) => Promise<SessionValidationResult>;

  /** Generate client metadata */
  getClientMetadata: () => ClientMetadata;

  /** Direct access to sessions instance for advanced usage */
  sessions: any; // HonoOAuthSessions instance
}
