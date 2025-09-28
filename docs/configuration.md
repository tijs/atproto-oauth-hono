# Configuration Reference

Complete reference for all configuration options available in `@tijs/atproto-oauth-hono`.

## Basic Configuration

```typescript
import { createATProtoOAuth } from "jsr:@tijs/atproto-oauth-hono@^0.2.6";

const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.town",
  cookieSecret: "your-secure-secret",
  appName: "My App",
  sessionTtl: 60 * 60 * 24, // 24 hours
  storage: myStorage,
});
```

## Configuration Options

### Required Options

#### `baseUrl` (string)
The base URL of your application. Used for OAuth redirects and client metadata.

```typescript
// Val.Town example
baseUrl: "https://myapp.val.run"

// Custom domain example
baseUrl: "https://myapp.com"
```

**Important**: Must match your actual deployment URL exactly.

#### `cookieSecret` (string)
Secret used for encrypting session cookies. Should be a cryptographically secure random string.

```typescript
// From environment variable (recommended)
cookieSecret: Deno.env.get("COOKIE_SECRET")

// Generate with: openssl rand -base64 32
cookieSecret: "your-secure-32-char-random-string"
```

**Security**: Never hardcode this in your source code. Always use environment variables.

#### `appName` (string)
Human-readable name for your application, displayed during OAuth consent.

```typescript
appName: "Book Explorer"
appName: "My AT Protocol App"
```

#### `sessionTtl` (number)
Session time-to-live in seconds. **Required** to prevent Iron Session errors.

```typescript
sessionTtl: 60 * 60 * 24,      // 24 hours
sessionTtl: 60 * 60 * 24 * 7,  // 7 days
sessionTtl: 60 * 60 * 24 * 30, // 30 days
```

**Note**: Longer sessions are more convenient but less secure. Choose based on your app's needs.

#### `storage` (OAuthStorage)
Storage adapter for session persistence. Use `DrizzleStorage` for database storage.

```typescript
import { DrizzleStorage } from "jsr:@tijs/atproto-oauth-hono@^0.2.6/drizzle";

storage: new DrizzleStorage(db)
```

### Optional Options

#### `mobileScheme` (string)
Custom URL scheme for mobile app redirects.

```typescript
mobileScheme: "myapp://auth-callback"
```

**Default**: Not used (web-only)

#### `logoUri` (string)
URL to your app's logo, displayed during OAuth consent.

```typescript
logoUri: "https://myapp.val.run/logo.png"
```

**Default**: No logo

#### `policyUri` (string)
URL to your privacy policy, displayed during OAuth consent.

```typescript
policyUri: "https://myapp.val.run/privacy"
```

**Default**: No policy link

#### `scope` (string)
OAuth scope to request. Usually you don't need to change this.

```typescript
scope: "atproto transition:generic"
```

**Default**: `"atproto transition:generic"`

## Complete Example

```typescript
import { createATProtoOAuth } from "jsr:@tijs/atproto-oauth-hono@^0.2.6";
import { DrizzleStorage } from "jsr:@tijs/atproto-oauth-hono@^0.2.6/drizzle";
import { db } from "./database/db.ts";

const oauth = createATProtoOAuth({
  // Required options
  baseUrl: Deno.env.get("BASE_URL") || "https://myapp.val.run",
  cookieSecret: Deno.env.get("COOKIE_SECRET"),
  appName: "My AT Protocol App",
  sessionTtl: 60 * 60 * 24, // 24 hours
  storage: new DrizzleStorage(db),

  // Optional options
  logoUri: "https://myapp.val.run/static/logo.png",
  policyUri: "https://myapp.val.run/privacy-policy",
  mobileScheme: "myapp://auth-callback",
});
```

## Environment Variables

Recommended environment variables for your Val.Town app:

```bash
# Required
COOKIE_SECRET=your-secure-random-string

# Optional but recommended
BASE_URL=https://myapp.val.run
APP_NAME="My App Name"
```

Access in your code:
```typescript
const oauth = createATProtoOAuth({
  baseUrl: Deno.env.get("BASE_URL") || "https://default.val.run",
  cookieSecret: Deno.env.get("COOKIE_SECRET") || "fallback-secret",
  appName: Deno.env.get("APP_NAME") || "My App",
  sessionTtl: 60 * 60 * 24,
  storage,
});
```

## Client Metadata Configuration

The OAuth package automatically generates client metadata, but you may want to customize it:

```typescript
// This endpoint is automatically provided, but you can override it
app.get("/client-metadata.json", (c) => {
  const metadata = {
    "client_id": `${baseUrl}/client-metadata.json`,
    "client_name": appName,
    "client_uri": baseUrl,
    "redirect_uris": [`${baseUrl}/oauth/callback`],
    "scope": "atproto transition:generic",
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "application_type": "web",
    "token_endpoint_auth_method": "none",
    "dpop_bound_access_tokens": true,

    // Optional customizations
    "logo_uri": logoUri,
    "policy_uri": policyUri,
    "tos_uri": tosUri,
  };
  return c.json(metadata);
});
```

## Storage Configuration

### DrizzleStorage with Custom Schema

```typescript
import { DrizzleStorage } from "jsr:@tijs/atproto-oauth-hono@^0.2.6/drizzle";

// Use custom table name (optional)
const storage = new DrizzleStorage(db, {
  tableName: "custom_oauth_sessions"
});
```

### Required Database Schema

Your database must include the Iron Session storage table:

```typescript
export const ironSessionStorageTable = sqliteTable("iron_session_storage", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
```

## Security Considerations

### Cookie Secret
- Use a cryptographically secure random string
- At least 32 characters long
- Store in environment variables, never in code
- Rotate periodically for high-security applications

### Session TTL
- Shorter TTL = better security, less convenience
- Longer TTL = better UX, higher security risk
- Consider your app's sensitivity when choosing

### HTTPS
- Always use HTTPS in production
- Val.Town automatically provides HTTPS
- HTTP will not work with secure cookies

### Cookie Settings
The package automatically configures secure cookie settings:
- `HttpOnly`: Prevents JavaScript access
- `Secure`: Requires HTTPS
- `SameSite`: CSRF protection

## Common Configuration Patterns

### Development vs Production

```typescript
const isDev = Deno.env.get("ENVIRONMENT") === "development";

const oauth = createATProtoOAuth({
  baseUrl: isDev
    ? "http://localhost:8000"
    : "https://myapp.val.run",
  cookieSecret: Deno.env.get("COOKIE_SECRET"),
  appName: isDev ? "My App (Dev)" : "My App",
  sessionTtl: isDev ? 60 * 60 : 60 * 60 * 24, // 1 hour dev, 24 hours prod
  storage,
});
```

### Multi-environment Configuration

```typescript
const config = {
  development: {
    baseUrl: "http://localhost:8000",
    sessionTtl: 60 * 60, // 1 hour
  },
  staging: {
    baseUrl: "https://myapp-staging.val.run",
    sessionTtl: 60 * 60 * 24, // 24 hours
  },
  production: {
    baseUrl: "https://myapp.val.run",
    sessionTtl: 60 * 60 * 24 * 7, // 7 days
  },
};

const env = Deno.env.get("ENVIRONMENT") || "development";
const envConfig = config[env];

const oauth = createATProtoOAuth({
  ...envConfig,
  cookieSecret: Deno.env.get("COOKIE_SECRET"),
  appName: "My App",
  storage,
});
```

This configuration reference covers all available options and common patterns for setting up your AT Protocol OAuth integration.