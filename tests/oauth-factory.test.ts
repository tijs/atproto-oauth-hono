import { assertEquals, assertThrows } from "@std/assert";
import { createATProtoOAuth } from "../src/oauth-factory.ts";
import type { ATProtoOAuthConfig } from "../src/types.ts";

Deno.test("createATProtoOAuth - basic configuration", () => {
  const config: ATProtoOAuthConfig = {
    baseUrl: "https://myapp.val.town",
    appName: "Test App",
    cookieSecret: "test-secret-for-testing-only-32chars",
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
    cookieSecret: "test-secret-for-testing-only-32chars",
  };

  const oauth = createATProtoOAuth(config);
  const metadata = oauth.getClientMetadata();

  assertEquals(metadata.client_name, "Test App");
});

Deno.test("createATProtoOAuth - normalizes baseUrl", () => {
  const config: ATProtoOAuthConfig = {
    baseUrl: "https://myapp.val.town/",
    appName: "Test App",
    cookieSecret: "test-secret-for-testing-only-32chars",
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

Deno.test("createATProtoOAuth - configures sessionTtl", () => {
  const oauth = createATProtoOAuth({
    baseUrl: "https://example.com",
    appName: "Test App",
    sessionTtl: 60 * 60 * 24 * 30, // 30 days
  });

  // Verify the oauth instance was created successfully
  assertEquals(typeof oauth.routes, "object");
  assertEquals(typeof oauth.validateSession, "function");
  assertEquals(typeof oauth.sessions, "object");
});
