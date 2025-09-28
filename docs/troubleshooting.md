# Troubleshooting Guide

Common issues and solutions when using `@tijs/atproto-oauth-hono` with Val.Town.

## Common Errors

### "option maxAge is invalid" Error

**Error**: `OAuth callback failed: option maxAge is invalid`

**Cause**: Missing or invalid `sessionTtl` configuration in OAuth setup.

**Solution**: Always include `sessionTtl` in your OAuth configuration:

```typescript
// ✅ Correct
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.run",
  cookieSecret: "your-secret",
  appName: "My App",
  sessionTtl: 60 * 60 * 24, // Required!
  storage,
});

// ❌ Wrong - missing sessionTtl
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.run",
  cookieSecret: "your-secret",
  appName: "My App",
  // sessionTtl missing - will cause maxAge error
  storage,
});
```

### "Type instantiation is excessively deep" TypeScript Error

**Error**: TypeScript compilation fails with "Type instantiation is excessively
deep and possibly infinite"

**Cause**: Complex type inference in Hono route mounting.

**Solution**: Add `@ts-ignore` comment before route mounting:

```typescript
// ✅ Correct - suppresses TypeScript error
// @ts-ignore - Type instantiation too deep but works at runtime
app.route("/", oauth.routes);

// Alternative: Try/catch approach
try {
  app.route("/", oauth.routes);
  console.log("✅ OAuth routes mounted successfully");
} catch (error) {
  console.error("❌ Failed to mount OAuth routes:", error);
  throw error;
}
```

### "Could not find repo" Error

**Error**:
`{"error":"InvalidRequest","message":"Could not find repo: did:plc:..."}`

**Cause**: Trying to fetch data from wrong PDS (e.g., `bsky.social` instead of
user's actual PDS).

**Solution**: Use the `oauthSession.pdsUrl` from the authenticated session:

```typescript
// ✅ Correct - use user's actual PDS
const response = await oauthSession.makeRequest(
  "GET",
  `${oauthSession.pdsUrl}/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=app.bsky.feed.post`,
);

// ❌ Wrong - hardcoded to bsky.social
const response = await fetch(
  `https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=app.bsky.feed.post`,
);
```

### Session Not Found After Login

**Error**: User redirected back to login page after successful OAuth

**Cause**: Frontend not checking authentication status correctly.

**Solution**: Use the `/api/auth/session` endpoint:

```typescript
// ✅ Correct - check session via API
const checkAuth = async () => {
  const response = await fetch("/api/auth/session", {
    credentials: "include", // Important!
  });
  const data = await response.json();
  return data.valid && data.did;
};

// ❌ Wrong - looking for URL parameters
const urlParams = new URLSearchParams(window.location.search);
const sessionParam = urlParams.get("session");
```

### Database Migration Errors

**Error**: `table iron_session_storage doesn't exist`

**Cause**: Required OAuth storage table not created.

**Solution**: Ensure your migrations create the required table:

```typescript
export async function runMigrations() {
  try {
    // Required table for OAuth package
    await rawDb.execute({
      sql: `
        CREATE TABLE IF NOT EXISTS iron_session_storage (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          expires_at INTEGER,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `,
      args: [],
    });

    console.log("Database migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
```

### "Module not found" Errors

**Error**: Import errors for `iron-session` or other dependencies

**Cause**: Missing or incorrect dependency imports.

**Solution**: Use exact dependency versions:

```typescript
// ✅ Correct imports for Val.Town
import { sqlite } from "https://esm.town/v/std/sqlite2"; // Note: sqlite2!
import { drizzle } from "https://esm.sh/drizzle-orm@0.44.5/sqlite-proxy";
import { getIronSession, unsealData } from "npm:iron-session@8.0.4";

// ❌ Wrong versions
import { sqlite } from "https://esm.town/v/stevekrouse/sqlite"; // Old version
import { drizzle } from "https://esm.sh/drizzle-orm/sqlite-proxy"; // No version pin
```

## Authentication Issues

### Cookies Not Being Sent

**Problem**: API calls return 401 even after login

**Cause**: Missing `credentials: "include"` in fetch requests.

**Solution**: Always include credentials in fetch calls:

```typescript
// ✅ Correct
const response = await fetch("/api/data", {
  credentials: "include",
});

// ❌ Wrong
const response = await fetch("/api/data");
```

### Session Expires Immediately

**Problem**: User logged out right after login

**Cause**: Cookie configuration or environment issues.

**Solutions**:

1. **Check cookie secret**:

```typescript
// Ensure COOKIE_SECRET is set in Val.Town environment
const cookieSecret = Deno.env.get("COOKIE_SECRET");
if (!cookieSecret) {
  throw new Error("COOKIE_SECRET environment variable is required");
}
```

2. **Verify HTTPS**:

```typescript
// Val.Town provides HTTPS automatically, but check your baseUrl
baseUrl: "https://myapp.val.run", // ✅ HTTPS
baseUrl: "http://myapp.val.run",  // ❌ HTTP won't work
```

3. **Check session TTL**:

```typescript
// Ensure reasonable session TTL
sessionTtl: 60 * 60 * 24, // 24 hours - reasonable
sessionTtl: 60,           // 1 minute - too short
```

### DPoP Token Errors

**Error**: `"Malformed token"` or `"DPoP proof required"`

**Cause**: Manual token handling instead of using OAuth package methods.

**Solution**: Use `oauthSession.makeRequest()` for authenticated calls:

```typescript
// ✅ Correct - package handles DPoP automatically
const response = await oauthSession.makeRequest(
  "GET",
  `${oauthSession.pdsUrl}/xrpc/com.atproto.repo.getRecord?repo=${did}&collection=app.bsky.feed.post&rkey=${rkey}`,
);

// ❌ Wrong - manual token handling
const response = await fetch(url, {
  headers: {
    "Authorization": `Bearer ${accessToken}`, // Won't work with DPoP
  },
});
```

## Database Issues

### SQLite Version Conflicts

**Error**: Database operations failing or methods not found

**Cause**: Using wrong SQLite version for Val.Town.

**Solution**: Use `sqlite2` specifically:

```typescript
// ✅ Correct for Val.Town
import { sqlite } from "https://esm.town/v/std/sqlite2";

// ❌ Wrong - old version
import { sqlite } from "https://esm.town/v/stevekrouse/sqlite";
```

### Drizzle Schema Errors

**Error**: Table or column not found errors

**Cause**: Schema mismatch or missing migrations.

**Solution**: Ensure schema matches your database:

```typescript
// Verify your schema matches the required structure
export const ironSessionStorageTable = sqliteTable("iron_session_storage", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at"), // Note: snake_case
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
```

## Development Debugging

### Enable Detailed Logging

Add logging to understand what's happening:

```typescript
// Add to your OAuth setup
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.run",
  cookieSecret: Deno.env.get("COOKIE_SECRET"),
  appName: "My App",
  sessionTtl: 60 * 60 * 24,
  storage,
});

// Log OAuth route mounting
try {
  // @ts-ignore
  app.route("/", oauth.routes);
  console.log("✅ OAuth routes mounted successfully");
} catch (error) {
  console.error("❌ OAuth route mounting failed:", error);
  throw error;
}

// Add health check endpoint
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    oauth: !!oauth,
    routes: !!oauth.routes,
    hasStorage: !!storage,
  });
});
```

### Check Session Status

Add a debug endpoint to check session status:

```typescript
app.get("/api/debug/session", async (c) => {
  try {
    const authResult = await getAuthenticatedUser(c);

    return c.json({
      authenticated: !!authResult,
      user: authResult
        ? {
          did: authResult.did,
          hasOAuthSession: !!authResult.oauthSession,
          pdsUrl: authResult.oauthSession?.pdsUrl,
        }
        : null,
    });
  } catch (error) {
    return c.json({
      error: error.message,
      authenticated: false,
    });
  }
});
```

## Performance Issues

### Slow OAuth Operations

**Problem**: Login or API calls are slow

**Solutions**:

1. **Check database performance**:

```typescript
// Add timing to database operations
const start = Date.now();
await runMigrations();
console.log(`Migrations took ${Date.now() - start}ms`);
```

2. **Optimize session queries**:

```typescript
// Ensure proper indexing in your schema
export const ironSessionStorageTable = sqliteTable("iron_session_storage", {
  key: text("key").primaryKey(), // Already indexed
  value: text("value").notNull(),
  expiresAt: integer("expires_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
```

### Memory Issues

**Problem**: High memory usage or out of memory errors

**Solutions**:

1. **Check for session leaks**:

```typescript
// Monitor session storage size
app.get("/api/debug/storage", async (c) => {
  const sessionCount = await db.select().from(ironSessionStorageTable);
  return c.json({
    sessionCount: sessionCount.length,
    oldSessions: sessionCount.filter((s) =>
      s.expiresAt && s.expiresAt < Date.now()
    ).length,
  });
});
```

2. **Clean up expired sessions**:

```typescript
// Add cleanup job
const cleanupExpiredSessions = async () => {
  await db.delete(ironSessionStorageTable)
    .where(lt(ironSessionStorageTable.expiresAt, Date.now()));
};

// Run periodically (if Val.Town supports cron)
```

## Getting Help

If you're still experiencing issues:

1. **Check your environment variables** in Val.Town settings
2. **Verify your baseUrl** matches your deployment URL exactly
3. **Test with minimal configuration** first, then add features
4. **Check browser developer tools** for cookie and network issues
5. **Review console logs** for detailed error messages

## Common Working Configuration

If all else fails, here's a minimal working configuration:

```typescript
import { Hono } from "https://esm.sh/hono";
import { createATProtoOAuth } from "jsr:@tijs/atproto-oauth-hono@^0.2.6";
import { DrizzleStorage } from "jsr:@tijs/atproto-oauth-hono@^0.2.6/drizzle";
import { drizzle } from "https://esm.sh/drizzle-orm@0.44.5/sqlite-proxy";
import { sqlite } from "https://esm.town/v/std/sqlite2";

const app = new Hono();

// Simple schema
const db = drizzle(
  async (sql, params) => {
    const result = await sqlite.execute({ sql, args: params || [] });
    return { rows: result.rows };
  },
);

// Create required table
await sqlite.execute({
  sql: `
    CREATE TABLE IF NOT EXISTS iron_session_storage (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `,
  args: [],
});

// OAuth setup
const oauth = createATProtoOAuth({
  baseUrl: "https://your-app.val.run",
  cookieSecret: Deno.env.get("COOKIE_SECRET") || "fallback-secret",
  appName: "Test App",
  sessionTtl: 60 * 60 * 24,
  storage: new DrizzleStorage(db),
});

// @ts-ignore
app.route("/", oauth.routes);

export default app.fetch;
```

This minimal setup should work and help you identify what's causing issues in
your more complex configuration.
