# @tijs/atproto-oauth-hono

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/tijsteulings)

Complete ATProto OAuth integration for Hono applications. Get plug-and-play
ATProto authentication with web and mobile support in just a few lines of code.

## Features

- 🚀 **Plug-and-play** - Complete OAuth setup in 3 lines
- 📱 **Mobile ready** - Built-in mobile app WebView support with configurable
  URL schemes
- 🔄 **Session management** - Automatic token refresh and validation
- 🔧 **Flexible storage** - Pluggable storage (Memory, SQLite, Drizzle ORM)
- 🛡️ **Production tested** - Battle-tested in the Anchor app

## Quick Start

```typescript
import { Hono } from "@hono/hono";
import { createATProtoOAuth } from "jsr:@tijs/atproto-oauth-hono@^0.2.8";

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
  sessionTtl?: number; // Session TTL in seconds (default: 7 days). For mobile apps, consider 30+ days
  storage?: OAuthStorage; // Custom storage implementation (defaults to MemoryStorage)
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

## Storage Options

Choose the storage implementation that fits your needs:

### Memory Storage (Default)

Perfect for testing and development:

```typescript
// No configuration needed - uses MemoryStorage by default
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.town",
  appName: "My App",
});
```

### SQLite Storage

For raw SQLite databases (like Val.Town):

```typescript
import {
  createATProtoOAuth,
  SQLiteStorage,
} from "jsr:@tijs/atproto-oauth-hono@^0.2.8";

const storage = new SQLiteStorage(sqlite); // Your SQLite instance
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.town",
  appName: "My App",
  storage,
});
```

### Drizzle ORM Storage

For apps using Drizzle ORM:

```typescript
import { createATProtoOAuth } from "jsr:@tijs/atproto-oauth-hono@^0.2.8";
import {
  DrizzleStorage,
  ironSessionStorageTable,
} from "jsr:@tijs/atproto-oauth-hono@^0.2.8/drizzle";
import { drizzle } from "npm:drizzle-orm@0.33.0/better-sqlite3";

const db = drizzle(sqlite);
const storage = new DrizzleStorage(db);
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.town",
  appName: "My App",
  storage,
});

// Use ironSessionStorageTable in your migrations
// migrate(db, { migrationsFolder: "./migrations" });
```

**Note**: Drizzle-specific exports are in a separate `/drizzle` module to keep
the main package lightweight.

### Custom Storage

Implement your own storage by following the `OAuthStorage` interface:

```typescript
import type { OAuthStorage } from "jsr:@tijs/atproto-oauth-hono@^0.2.8";

class MyCustomStorage implements OAuthStorage {
  async get<T>(key: string): Promise<T | null> {/* your implementation */}
  async set<T>(
    key: string,
    value: T,
    options?: { ttl?: number },
  ): Promise<void> {/* your implementation */}
  async delete(key: string): Promise<void> {/* your implementation */}
}
```

## Session Configuration

Configure session duration for different use cases:

```typescript
// Short sessions for high-security apps (1 hour)
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.town",
  appName: "High Security App",
  sessionTtl: 60 * 60, // 1 hour
});

// Standard sessions (default: 7 days)
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.town",
  appName: "My App",
  // sessionTtl: 60 * 60 * 24 * 7, // 7 days (default)
});

// Extended sessions for mobile apps (30 days)
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.town",
  appName: "My Mobile App",
  sessionTtl: 60 * 60 * 24 * 30, // 30 days - good for mobile
});
```

> **Mobile App Recommendation**: Use 30+ day sessions for mobile apps to avoid
> frequent re-authentication in WebView scenarios.

## Examples

### Basic Web App

```typescript
import { Hono } from "@hono/hono";
import { createATProtoOAuth } from "jsr:@tijs/atproto-oauth-hono@^0.2.8";

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

### Protected Routes with Session Helpers

The package provides convenient helpers for authenticating routes:

```typescript
import { Hono } from "@hono/hono";
import { createATProtoOAuth } from "jsr:@tijs/atproto-oauth-hono@^1.1.0";

const app = new Hono();
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.town",
  appName: "My App",
});

app.route("/", oauth.routes);

// Protected route using session helpers
app.get("/api/bookmarks", async (c) => {
  // Extract and validate session from cookie in one call
  const oauthSession = await oauth.sessions.getOAuthSessionFromRequest(
    c.req.raw,
  );

  if (!oauthSession) {
    // Return 401 with cleared cookie
    const response = c.json({ error: "Authentication required" }, 401);
    response.headers.set("Set-Cookie", oauth.sessions.getClearCookieHeader());
    return response;
  }

  // Make authenticated API calls with automatic DPoP handling
  const response = await oauthSession.makeRequest(
    "GET",
    `${oauthSession.pdsUrl}/xrpc/com.atproto.repo.listRecords?collection=app.bsky.bookmark&repo=${oauthSession.did}`,
  );

  return c.json(await response.json());
});
```

**Available Helper Methods:**

- `oauth.sessions.getOAuthSessionFromRequest(req)` - Extract session from cookie
  and validate (with automatic token refresh)
- `oauth.sessions.getClearCookieHeader()` - Get Set-Cookie header to clear the
  session cookie

These helpers are provided by the underlying `@tijs/hono-oauth-sessions` package
and handle all the complexity of:

- Extracting and unsealing iron-session cookies
- Extracting the DID from session data
- Restoring OAuth sessions with automatic token refresh
- Generating proper cookie clearing headers

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

## Documentation

### Package Documentation

- **[Mobile OAuth Guide](docs/MOBILE_OAUTH.md)** - Complete mobile OAuth
  implementation guide
  - OAuth flow explanation
  - API endpoint reference
  - Security best practices
  - iOS/Android integration examples
  - Error handling strategies

- **[JSR Documentation](https://jsr.io/@tijs/atproto-oauth-hono)** - Complete
  API reference with examples
- **IntelliSense Support** - Full type information and examples in your editor

### Real-World Examples

- **[Anchor AppView](https://github.com/dropanchorapp/anchor-appview)** -
  Production implementation with mobile OAuth

The documentation includes:

- Complete Val.Town integration examples
- Multiple storage configuration patterns
- Frontend authentication with cookie-based sessions
- Troubleshooting guidance for common issues
- TypeScript type definitions with validation notes

## Built on

- [@tijs/oauth-client-deno](https://jsr.io/@tijs/oauth-client-deno) - Core OAuth
  client
- [@tijs/hono-oauth-sessions](https://jsr.io/@tijs/hono-oauth-sessions) -
  Session management
- [Hono](https://hono.dev) - Web framework

## Support

If this package helps you build your ATProto app, consider supporting its
development on [Ko-fi](https://ko-fi.com/tijsteulings).

## License

MIT
