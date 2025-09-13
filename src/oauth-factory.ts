/**
 * Main factory function for creating ATProto OAuth integration
 */

import type { ATProtoOAuthConfig, ATProtoOAuthInstance } from "./types.ts";
import { createOAuthRoutes } from "./oauth-routes.ts";
import { MemoryStorage } from "./storage/memory.ts";
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

  // Use provided storage or fallback to memory storage (for testing/development)
  const storage = config.storage || new MemoryStorage();

  // Create OAuth routes with storage
  const { routes, validateSession, sessions } = createOAuthRoutes(
    normalizedConfig,
    storage,
  );

  return {
    routes,
    validateSession,
    getClientMetadata: () => generateClientMetadata(normalizedConfig),
    sessions,
  };
}
