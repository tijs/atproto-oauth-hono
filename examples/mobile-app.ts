/**
 * Mobile-optimized ATProto OAuth example
 *
 * This example shows how to create an app optimized for mobile
 * WebView integration with custom URL schemes.
 */

import { Hono } from "@hono/hono";
import { createATProtoOAuth } from "../mod.ts";

const app = new Hono();

// Create OAuth with mobile-specific configuration
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.town",
  appName: "My Mobile ATProto App",
  mobileScheme: "myapp://auth-callback", // Your app's custom URL scheme
  logoUri: "https://myapp.val.town/app-icon.png",
  policyUri: "https://myapp.val.town/privacy",
  scope: "atproto transition:generic", // Standard ATProto scope
});

// Mount OAuth routes
app.route("/", oauth.routes);

// Mobile-optimized OAuth entry point
app.get("/mobile-auth", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login - My App</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
          }
          .container {
            max-width: 400px;
            margin: 50px auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 { text-align: center; color: #333; }
          input {
            width: 100%;
            padding: 15px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            margin-bottom: 20px;
            box-sizing: border-box;
          }
          button {
            width: 100%;
            padding: 15px;
            background: #1DA1F2;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
          }
          button:hover { background: #0d8bd9; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Login to My App</h1>
          <form action="/login" method="get">
            <input
              name="handle"
              placeholder="your.bsky.social"
              type="text"
              autocomplete="username"
              required
            />
            <button type="submit">Continue with ATProto</button>
          </form>
        </div>
      </body>
    </html>
  `);
});

// API endpoint for mobile token validation
app.post("/api/mobile/validate", async (c) => {
  try {
    const { token } = await c.req.json();

    if (!token) {
      return c.json({ valid: false, error: "Missing token" }, 400);
    }

    // Validate using Bearer token format
    const session = await oauth.validateSession(
      new Request("https://dummy.com", {
        headers: { "Authorization": `Bearer ${token}` },
      }),
    );

    if (!session.valid) {
      return c.json({ valid: false }, 401);
    }

    // Fetch profile data using the getProfile helper
    const profile = await oauth.getProfile(session.did!);

    return c.json({
      valid: true,
      user: {
        did: session.did,
        handle: session.handle,
        displayName: profile?.displayName,
        avatar: profile?.avatar,
      },
    });
  } catch (err) {
    console.error("Mobile validation error:", err);
    return c.json({ valid: false, error: "Validation failed" }, 500);
  }
});

// Protected API endpoint
app.get("/api/user/profile", async (c) => {
  const session = await oauth.validateSession(c.req.raw);

  if (!session.valid) {
    return c.json({ error: "Please login to continue" }, 401);
  }

  // Fetch profile data using the getProfile helper
  const profile = await oauth.getProfile(session.did!);

  // Return user profile data
  return c.json({
    did: session.did,
    handle: session.handle,
    displayName: profile?.displayName,
    avatar: profile?.avatar,
    // Access token available for AT Protocol API calls
    hasValidToken: !!session.accessToken,
  });
});

export default app;
