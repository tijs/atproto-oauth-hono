import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createATProtoOAuth } from "../src/oauth-factory.ts";
import type { ATProtoOAuthConfig } from "../src/types.ts";

Deno.test("createATProtoOAuth - basic configuration", () => {
  const config: ATProtoOAuthConfig = {
    baseUrl: "https://myapp.val.town",
    appName: "Test App",
  };

  const oauth = createATProtoOAuth(config);

  // Should have required properties
  assertEquals(typeof oauth.routes, "object");
  assertEquals(typeof oauth.validateSession, "function");
  assertEquals(typeof oauth.getClientMetadata, "function");

  // Should generate correct client metadata
  const metadata = oauth.getClientMetadata();
  assertEquals(metadata.client_name, "Test App");
  assertEquals(metadata.client_uri, "https://myapp.val.town");
});

Deno.test("createATProtoOAuth - with mobile scheme", () => {
  const config: ATProtoOAuthConfig = {
    baseUrl: "https://myapp.val.town",
    appName: "Test App",
    mobileScheme: "myapp://auth-callback",
  };

  const oauth = createATProtoOAuth(config);
  const metadata = oauth.getClientMetadata();

  assertEquals(metadata.client_name, "Test App");
});

Deno.test("createATProtoOAuth - normalizes baseUrl", () => {
  const config: ATProtoOAuthConfig = {
    baseUrl: "https://myapp.val.town/",
    appName: "Test App",
  };

  const oauth = createATProtoOAuth(config);
  const metadata = oauth.getClientMetadata();

  assertEquals(metadata.client_uri, "https://myapp.val.town");
});

Deno.test("createATProtoOAuth - throws on missing baseUrl", () => {
  assertThrows(
    () => {
      createATProtoOAuth({
        baseUrl: "",
        appName: "Test App",
      });
    },
    Error,
    "baseUrl is required",
  );
});

Deno.test("createATProtoOAuth - throws on missing appName", () => {
  assertThrows(
    () => {
      createATProtoOAuth({
        baseUrl: "https://myapp.val.town",
        appName: "",
      });
    },
    Error,
    "appName is required",
  );
});
