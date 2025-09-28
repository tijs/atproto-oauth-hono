# API Reference

Complete API reference for `@tijs/atproto-oauth-hono` methods and endpoints.

## Core Functions

### `createATProtoOAuth(config)`

Creates an OAuth instance with built-in routes and session management.

```typescript
import { createATProtoOAuth } from "jsr:@tijs/atproto-oauth-hono@^0.2.6";

const oauth = createATProtoOAuth(config);
```

**Parameters:**
- `config` (ATProtoOAuthConfig): Configuration object

**Returns:** ATProtoOAuthInstance

**Example:**
```typescript
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.run",
  cookieSecret: "your-secret",
  appName: "My App",
  sessionTtl: 60 * 60 * 24,
  storage: new DrizzleStorage(db),
});
```

## OAuth Instance Properties

### `oauth.routes`

Hono router containing all OAuth endpoints. Mount this to handle authentication.

```typescript
// @ts-ignore - Type instantiation issue, but works at runtime
app.route("/", oauth.routes);
```

**Provides endpoints:**
- `GET /login?handle=...` - Start OAuth flow
- `GET /oauth/callback` - OAuth callback handler
- `POST /logout` - Clear session and logout
- `GET /api/auth/session` - Check authentication status

### `oauth.sessions`

Session management interface for working with authenticated users.

**Methods:**
- `getOAuthSession(did: string)` - Get OAuth session for a DID
- `getSession(request, response)` - Get session from request/response

## Session Management

### `oauth.sessions.getOAuthSession(did)`

Retrieves an OAuth session for a specific DID.

```typescript
const oauthSession = await oauth.sessions.getOAuthSession(userDid);
if (oauthSession) {
  // User is authenticated
  console.log("User:", oauthSession.handle);
  console.log("PDS:", oauthSession.pdsUrl);
}
```

**Parameters:**
- `did` (string): User's DID identifier

**Returns:** Promise<OAuthSession | null>

**OAuthSession Properties:**
- `did` (string): User's DID
- `handle` (string): User's handle (e.g., "user.bsky.social")
- `pdsUrl` (string): User's Personal Data Server URL
- `accessToken` (string): Access token for API calls
- `refreshToken` (string): Refresh token for token renewal
- `makeRequest(method, url, options?)` - Make authenticated requests

### `oauthSession.makeRequest(method, url, options)`

Makes authenticated requests to AT Protocol endpoints with automatic DPoP handling.

```typescript
// GET request
const response = await oauthSession.makeRequest(
  "GET",
  `${oauthSession.pdsUrl}/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=app.bsky.feed.post`
);

// POST request
const response = await oauthSession.makeRequest(
  "POST",
  `${oauthSession.pdsUrl}/xrpc/com.atproto.repo.createRecord`,
  {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repo: did,
      collection: "app.bsky.feed.post",
      record: { text: "Hello world!", createdAt: new Date().toISOString() }
    })
  }
);
```

**Parameters:**
- `method` (string): HTTP method ("GET", "POST", "PUT", "DELETE")
- `url` (string): Full URL to request
- `options` (RequestInit, optional): Additional fetch options

**Returns:** Promise<Response>

**Features:**
- Automatic DPoP proof generation
- Token refresh handling
- Proper authentication headers

## Built-in Endpoints

When you mount `oauth.routes`, these endpoints become available:

### `GET /login?handle=<handle>`

Starts the OAuth flow for a given handle.

**Parameters:**
- `handle` (query): User's AT Protocol handle

**Example:**
```typescript
// Redirect user to start login
globalThis.location.href = `/login?handle=${encodeURIComponent("user.bsky.social")}`;
```

**Flow:**
1. Resolves handle to DID and PDS
2. Initiates OAuth flow with user's PDS
3. Redirects to authorization server
4. Returns to `/oauth/callback` after consent

### `GET /oauth/callback`

Handles OAuth callback and completes authentication.

**Parameters:**
- `code` (query): Authorization code from OAuth server
- `state` (query): State parameter for CSRF protection

**Behavior:**
- Exchanges code for tokens
- Stores session securely
- Redirects to your app

### `POST /logout`

Clears the user's session and logs them out.

```typescript
// Logout user
await fetch("/logout", {
  method: "POST",
  credentials: "include",
});
```

**Behavior:**
- Destroys server-side session
- Clears authentication cookies
- Returns success response

### `GET /api/auth/session`

Returns current authentication status and user information.

```typescript
const response = await fetch("/api/auth/session", {
  credentials: "include",
});
const data = await response.json();

if (data.valid) {
  console.log("User DID:", data.did);
  console.log("Handle:", data.handle);
  console.log("PDS URL:", data.pdsUrl);
}
```

**Response Format:**
```json
{
  "valid": true,
  "did": "did:plc:abc123...",
  "handle": "user.bsky.social",
  "pdsUrl": "https://morel.us-east.host.bsky.network"
}
```

**When not authenticated:**
```json
{
  "valid": false
}
```

## Storage Adapters

### `DrizzleStorage`

Database storage adapter using Drizzle ORM.

```typescript
import { DrizzleStorage } from "jsr:@tijs/atproto-oauth-hono@^0.2.6/drizzle";

const storage = new DrizzleStorage(db, options?);
```

**Parameters:**
- `db`: Drizzle database instance
- `options` (optional): Configuration options
  - `tableName` (string): Custom table name (default: "iron_session_storage")

**Required Schema:**
```typescript
export const ironSessionStorageTable = sqliteTable("iron_session_storage", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
```

### `MemoryStorage`

In-memory storage adapter for development/testing.

```typescript
import { MemoryStorage } from "jsr:@tijs/atproto-oauth-hono@^0.2.6";

const storage = new MemoryStorage();
```

**Warning:** Data is lost when the process restarts. Only use for development.

## Helper Functions

### Authentication Helper Pattern

Common pattern for extracting authenticated user from requests:

```typescript
async function getAuthenticatedUser(c: Context) {
  try {
    const { getIronSession, unsealData } = await import("npm:iron-session@8.0.4");
    const cookieSecret = Deno.env.get("COOKIE_SECRET");
    let userDid: string | null = null;

    // Try Bearer token first (mobile apps)
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const sealedToken = authHeader.slice(7);
        const sessionData = await unsealData(sealedToken, {
          password: cookieSecret,
        }) as { did: string };
        userDid = sessionData.did;
      } catch (err) {
        console.log("Bearer token authentication failed:", err);
      }
    }

    // Fallback to cookie authentication (web)
    if (!userDid) {
      try {
        interface Session {
          did: string;
        }
        const session = await getIronSession<Session>(c.req.raw, c.res, {
          cookieName: "sid",
          password: cookieSecret,
        });
        userDid = session.did;

        if (userDid) {
          await session.save(); // Extend session TTL
        }
      } catch (err) {
        console.log("Cookie authentication failed:", err);
      }
    }

    if (!userDid) {
      return null;
    }

    // Get OAuth session data
    const oauthSession = await oauth.sessions.getOAuthSession(userDid);
    if (!oauthSession) {
      return null;
    }

    return { did: userDid, oauthSession };
  } catch (error) {
    console.error("Failed to get authenticated user:", error);
    return null;
  }
}
```

## Error Handling

### Common Error Responses

**Authentication Required:**
```json
{
  "error": "Authentication required",
  "status": 401
}
```

**Session Expired:**
```json
{
  "error": "Session expired",
  "status": 401
}
```

**OAuth Flow Error:**
```json
{
  "error": "OAuth failed",
  "message": "Invalid authorization code",
  "status": 400
}
```

### Error Handling Pattern

```typescript
app.get("/api/protected", async (c) => {
  try {
    const authResult = await getAuthenticatedUser(c);

    if (!authResult) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const { did, oauthSession } = authResult;

    // Make authenticated request
    const response = await oauthSession.makeRequest(
      "GET",
      `${oauthSession.pdsUrl}/xrpc/some.endpoint`
    );

    if (!response.ok) {
      return c.json({
        error: "Upstream request failed",
        status: response.status
      }, response.status);
    }

    return c.json(await response.json());
  } catch (error) {
    console.error("API error:", error);
    return c.json({
      error: "Internal server error"
    }, 500);
  }
});
```

## TypeScript Types

### ATProtoOAuthConfig

```typescript
interface ATProtoOAuthConfig {
  baseUrl: string;
  cookieSecret: string;
  appName: string;
  sessionTtl: number;
  storage: OAuthStorage;
  mobileScheme?: string;
  logoUri?: string;
  policyUri?: string;
  scope?: string;
}
```

### ATProtoOAuthInstance

```typescript
interface ATProtoOAuthInstance {
  routes: Hono;
  sessions: OAuthSessionsInterface;
}
```

### OAuthSession

```typescript
interface OAuthSession {
  did: string;
  handle: string;
  pdsUrl: string;
  accessToken: string;
  refreshToken: string;
  makeRequest(method: string, url: string, options?: RequestInit): Promise<Response>;
}
```

This API reference covers all the main methods and patterns you'll use when integrating AT Protocol OAuth with your Hono application.