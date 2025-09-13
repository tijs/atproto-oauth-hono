import type { ATProtoOAuthConfig, ClientMetadata } from "./types.ts";

/**
 * Generate ATProto OAuth client metadata
 * Based on location-feed-generator/backend/routes/oauth.ts:34-49
 */
export function generateClientMetadata(
  config: ATProtoOAuthConfig,
): ClientMetadata {
  const baseUrl = config.baseUrl.replace(/\/$/, "");

  const metadata: ClientMetadata = {
    client_name: config.appName,
    client_id: `${baseUrl}/client-metadata.json`,
    client_uri: baseUrl,
    redirect_uris: [`${baseUrl}/oauth/callback`],
    scope: config.scope || "atproto transition:generic",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    application_type: "web",
    token_endpoint_auth_method: "none",
    dpop_bound_access_tokens: true,
  };

  if (config.logoUri) {
    metadata.logo_uri = config.logoUri;
  }

  if (config.policyUri) {
    metadata.policy_uri = config.policyUri;
  }

  return metadata;
}
