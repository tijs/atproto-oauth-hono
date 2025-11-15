/**
 * Basic ATProto OAuth example for Val.Town
 *
 * This example shows how to create a simple ATProto-enabled app
 * with just a few lines of code.
 */

import { Hono } from "@hono/hono";
import { createATProtoOAuth } from "../mod.ts";

const app = new Hono();

// Create OAuth integration
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.town",
  appName: "My ATProto App",
  mobileScheme: "myapp://auth-callback",
  logoUri: "https://myapp.val.town/logo.png",
  policyUri: "https://myapp.val.town/privacy",
});

// Mount OAuth routes
app.route("/", oauth.routes);

// Protected API endpoint example
app.get("/api/profile", async (c) => {
  const session = await oauth.validateSession(c.req.raw);

  if (!session.valid) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Fetch profile data using the getProfile helper
  const profile = await oauth.getProfile(session.did!);

  return c.json({
    did: session.did,
    handle: session.handle,
    displayName: profile?.displayName,
    avatar: profile?.avatar,
  });
});

// Simple home page
app.get("/", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>My ATProto App</title>
      </head>
      <body>
        <h1>Welcome to My ATProto App</h1>
        <form action="/login" method="get">
          <input name="handle" placeholder="your.bsky.social" required />
          <button type="submit">Login with ATProto</button>
        </form>
      </body>
    </html>
  `);
});

export default app;
