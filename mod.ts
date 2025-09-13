/**
 * @fileoverview Complete ATProto OAuth integration for Hono applications on Val.Town
 *
 * Provides plug-and-play ATProto OAuth authentication with:
 * - Web and mobile OAuth flows
 * - Session management with automatic token refresh
 * - Val.Town SQLite storage integration
 * - Configurable client metadata
 */

export { createATProtoOAuth } from "./src/oauth-factory.ts";
export type {
  ATProtoOAuthConfig,
  ATProtoOAuthInstance,
  ClientMetadata,
} from "./src/types.ts";
export { ValTownStorage } from "./src/storage/valtown.ts";
