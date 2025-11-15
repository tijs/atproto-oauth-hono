import { assertEquals } from "@std/assert";
import { createATProtoOAuth } from "../src/oauth-factory.ts";

Deno.test("Sessions instance should be exposed with all required methods", () => {
  const oauth = createATProtoOAuth({
    baseUrl: "https://test.val.town",
    appName: "Test App",
    cookieSecret: "test-secret-for-testing-only-32chars",
  });

  // Should have sessions property
  assertEquals(typeof oauth.sessions, "object");

  // Should have all required methods from location-feed-generator
  assertEquals(typeof oauth.sessions.getOAuthSession, "function");
  assertEquals(typeof oauth.sessions.startOAuth, "function");
  assertEquals(typeof oauth.sessions.handleCallback, "function");
  assertEquals(typeof oauth.sessions.refreshMobileToken, "function");
  assertEquals(typeof oauth.sessions.validateSession, "function");
  assertEquals(typeof oauth.sessions.validateMobileSession, "function");
  assertEquals(typeof oauth.sessions.getStoredOAuthData, "function");
  assertEquals(typeof oauth.sessions.logout, "function");
});
