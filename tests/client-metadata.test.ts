import { assertEquals } from "@std/assert";
import { generateClientMetadata } from "../src/client-metadata.ts";
import type { ATProtoOAuthConfig } from "../src/types.ts";

Deno.test("generateClientMetadata - basic configuration", () => {
  const config: ATProtoOAuthConfig = {
    baseUrl: "https://myapp.val.town",
    appName: "Test App",
  };

  const metadata = generateClientMetadata(config);

  assertEquals(metadata.client_name, "Test App");
  assertEquals(
    metadata.client_id,
    "https://myapp.val.town/oauth-client-metadata.json",
  );
  assertEquals(metadata.client_uri, "https://myapp.val.town");
  assertEquals(metadata.redirect_uris, [
    "https://myapp.val.town/oauth/callback",
  ]);
  assertEquals(metadata.scope, "atproto transition:generic");
  assertEquals(metadata.grant_types, ["authorization_code", "refresh_token"]);
  assertEquals(metadata.response_types, ["code"]);
  assertEquals(metadata.application_type, "web");
  assertEquals(metadata.token_endpoint_auth_method, "none");
  assertEquals(metadata.dpop_bound_access_tokens, true);
});

Deno.test("generateClientMetadata - with trailing slash", () => {
  const config: ATProtoOAuthConfig = {
    baseUrl: "https://myapp.val.town/",
    appName: "Test App",
  };

  const metadata = generateClientMetadata(config);

  assertEquals(metadata.client_uri, "https://myapp.val.town");
  assertEquals(metadata.redirect_uris, [
    "https://myapp.val.town/oauth/callback",
  ]);
});

Deno.test("generateClientMetadata - with optional fields", () => {
  const config: ATProtoOAuthConfig = {
    baseUrl: "https://myapp.val.town",
    appName: "Test App",
    logoUri: "https://myapp.val.town/logo.png",
    policyUri: "https://myapp.val.town/privacy",
    scope: "custom scope",
  };

  const metadata = generateClientMetadata(config);

  assertEquals(metadata.logo_uri, "https://myapp.val.town/logo.png");
  assertEquals(metadata.policy_uri, "https://myapp.val.town/privacy");
  assertEquals(metadata.scope, "custom scope");
});

Deno.test("generateClientMetadata - without optional fields", () => {
  const config: ATProtoOAuthConfig = {
    baseUrl: "https://myapp.val.town",
    appName: "Test App",
  };

  const metadata = generateClientMetadata(config);

  assertEquals(metadata.logo_uri, undefined);
  assertEquals(metadata.policy_uri, undefined);
});
