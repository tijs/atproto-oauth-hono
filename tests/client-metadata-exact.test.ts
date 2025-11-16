import { assertEquals } from "@std/assert";
import { createATProtoOAuth } from "../src/oauth-factory.ts";

Deno.test("Client metadata should match location-feed-generator exactly", () => {
  const oauth = createATProtoOAuth({
    baseUrl: "https://dropanchor.app",
    appName: "Anchor Location Feed",
    logoUri: "https://dropanchor.app/static/anchor-logo-transparent.png",
    policyUri: "https://dropanchor.app/privacy-policy",
    cookieSecret: "test-secret-for-testing-only-32chars",
  });

  const metadata = oauth.getClientMetadata();

  // Should match location-feed-generator exactly
  assertEquals(metadata.client_name, "Anchor Location Feed");
  assertEquals(
    metadata.client_id,
    "https://dropanchor.app/oauth-client-metadata.json",
  );
  assertEquals(metadata.client_uri, "https://dropanchor.app");
  assertEquals(metadata.redirect_uris, [
    "https://dropanchor.app/oauth/callback",
  ]);
  assertEquals(metadata.scope, "atproto transition:generic");
  assertEquals(metadata.grant_types, ["authorization_code", "refresh_token"]);
  assertEquals(metadata.response_types, ["code"]);
  assertEquals(metadata.application_type, "web");
  assertEquals(metadata.token_endpoint_auth_method, "none");
  assertEquals(metadata.dpop_bound_access_tokens, true);
  assertEquals(
    metadata.logo_uri,
    "https://dropanchor.app/static/anchor-logo-transparent.png",
  );
  assertEquals(metadata.policy_uri, "https://dropanchor.app/privacy-policy");
});
