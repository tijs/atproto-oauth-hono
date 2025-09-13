# @tijs/atproto-oauth-hono

Complete ATProto OAuth integration for Hono applications on Val.Town. Get
plug-and-play ATProto authentication with web and mobile support in just a few
lines of code.

## Features

- 🚀 **Plug-and-play** - Complete OAuth setup in 3 lines
- 📱 **Mobile ready** - Built-in mobile app WebView support with configurable
  URL schemes
- 🔄 **Session management** - Automatic token refresh and validation
- 🗄️ **Val.Town optimized** - Uses Val.Town SQLite for session storage
- 🛡️ **Production tested** - Battle-tested in the Anchor app

## Quick Start

```typescript
import { Hono } from "@hono/hono";
import { createATProtoOAuth } from "jsr:@tijs/atproto-oauth-hono";

const app = new Hono();

const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.town",
  appName: "My Cool ATProto App",
  mobileScheme: "myapp://auth-callback",
});

app.route("/", oauth.routes);

export default app;
```

That's it! Your app now has:

- `/login` - Web OAuth flow
- `/oauth/callback` - OAuth callback handler
- `/client-metadata.json` - ATProto client metadata
- `/api/auth/session` - Session validation
- `/api/auth/mobile-start` - Mobile OAuth initiation
- `/api/auth/logout` - Session cleanup

## Configuration

```typescript
interface ATProtoOAuthConfig {
  baseUrl: string; // Your app's base URL
  appName: string; // Display name for OAuth consent
  mobileScheme?: string; // Custom URL scheme for mobile (default: "app://auth-callback")
  logoUri?: string; // App logo URL
  policyUri?: string; // Privacy policy URL
  cookieSecret?: string; // Cookie signing secret (uses env COOKIE_SECRET)
  scope?: string; // OAuth scope (default: "atproto transition:generic")
}
```

## Available Routes

When you mount the OAuth routes, your app automatically gets:

### Authentication Flow

- `GET /login?handle=user.bsky.social` - Start OAuth flow
- `GET /oauth/callback` - OAuth callback handler
- `GET /client-metadata.json` - ATProto client metadata

### Session Management

- `GET /api/auth/session` - Validate session (web + mobile)
- `GET /validate-session` - Simple session check
- `POST /api/auth/logout` - End session

### Mobile App Support

- `POST /api/auth/mobile-start` - Start mobile OAuth flow
- `GET /mobile/refresh-token` - Refresh mobile tokens

## Examples

### Basic Web App

```typescript
import { Hono } from "@hono/hono";
import { createATProtoOAuth } from "jsr:@tijs/atproto-oauth-hono";

const app = new Hono();
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.town",
  appName: "My ATProto App",
});

app.route("/", oauth.routes);

// Protected endpoint
app.get("/api/profile", async (c) => {
  const session = await oauth.validateSession(c.req.raw);
  if (!session.valid) return c.json({ error: "Unauthorized" }, 401);

  return c.json({
    did: session.did,
    handle: session.handle,
  });
});

export default app;
```

### Mobile App Integration

```typescript
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.town",
  appName: "My Mobile App",
  mobileScheme: "myapp://auth-callback", // Your custom scheme
});

// Mobile auth page at /mobile-auth
app.get("/mobile-auth", (c) => {
  return c.html(`<form action="/login">...</form>`);
});
```

## Mobile App Integration

For mobile apps using WebView:

1. Register your custom URL scheme in your app
2. Load the OAuth flow in a WebView
3. Handle the callback URL with authentication data

```swift
// iOS example - register URL scheme in Info.plist
// Then handle the callback:
func handleAuthCallback(url: URL) {
  // Parse tokens from URL parameters
  let accessToken = url.getQueryParam("access_token")
  let did = url.getQueryParam("did")
  // Store securely and close WebView
}
```

## Built on

- [@tijs/oauth-client-deno](https://jsr.io/@tijs/oauth-client-deno) - Core OAuth
  client
- [@tijs/hono-oauth-sessions](https://jsr.io/@tijs/hono-oauth-sessions) -
  Session management
- [Hono](https://hono.dev) - Web framework

## License

MIT
