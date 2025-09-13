/**
 * Main factory function for creating ATProto OAuth integration
 */

import type { ATProtoOAuthConfig, ATProtoOAuthInstance } from "./types.ts";
import { createOAuthRoutes } from "./oauth-routes.ts";
import { defaultValTownStorage } from "./storage/valtown.ts";
import { generateClientMetadata } from "./client-metadata.ts";

/**
 * Create a complete ATProto OAuth integration for Hono
 *
 * @param config Configuration for the OAuth integration
 * @returns ATProto OAuth instance with routes and helper methods
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

  // Create OAuth routes with default Val.Town storage
  const { routes, validateSession } = createOAuthRoutes(
    normalizedConfig,
    defaultValTownStorage,
  );

  return {
    routes,
    validateSession,
    getClientMetadata: () => generateClientMetadata(normalizedConfig),
  };
}
