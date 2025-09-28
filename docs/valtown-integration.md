# Val.Town Integration Guide

Complete guide for integrating `@tijs/atproto-oauth-hono` with Val.Town using Drizzle ORM and sqlite2.

## Prerequisites

- Val.Town account with environment variable support
- Basic familiarity with Hono and Drizzle ORM

## Required Dependencies

Add these to your Val.Town project:

```typescript
// Core dependencies
import { Hono } from "https://esm.sh/hono";
import { createATProtoOAuth } from "jsr:@tijs/atproto-oauth-hono@^0.2.6";
import { DrizzleStorage } from "jsr:@tijs/atproto-oauth-hono@^0.2.6/drizzle";

// Database dependencies (Val.Town specific)
import { drizzle } from "https://esm.sh/drizzle-orm@0.44.5/sqlite-proxy";
import { sqlite } from "https://esm.town/v/std/sqlite2"; // Note: sqlite2, not sqlite

// Schema dependencies
import {
  integer,
  sqliteTable,
  text,
} from "https://esm.sh/drizzle-orm@0.44.5/sqlite-core";
```

## Step 1: Environment Variables

Set these in your Val.Town environment:

```
COOKIE_SECRET=your-secure-random-string-here
```

Generate a secure cookie secret:
```bash
# Generate a secure random string
openssl rand -base64 32
```

## Step 2: Database Schema Setup

Create `backend/database/schema.ts`:

```typescript
import {
  integer,
  sqliteTable,
  text,
} from "https://esm.sh/drizzle-orm@0.44.5/sqlite-core";

// Required table for OAuth session storage
export const ironSessionStorageTable = sqliteTable("iron_session_storage", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Optional: Your app's user sessions (if needed)
export const userSessionsTable = sqliteTable("user_sessions", {
  did: text("did").primaryKey(),
  handle: text("handle").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  pdsUrl: text("pds_url"),
  createdAt: integer("created_at").notNull(),
});

// Export types
export type IronSessionInsert = typeof ironSessionStorageTable.$inferInsert;
export type IronSessionSelect = typeof ironSessionStorageTable.$inferSelect;
```

## Step 3: Database Connection

Create `backend/database/db.ts`:

```typescript
import { drizzle } from "https://esm.sh/drizzle-orm@0.44.5/sqlite-proxy";
import { sqlite } from "https://esm.town/v/std/sqlite2"; // Important: sqlite2!
import * as schema from "./schema.ts";

// Create Drizzle database instance using sqlite-proxy adapter
export const db = drizzle(
  async (sql, params) => {
    const result = await sqlite.execute({ sql, args: params || [] });
    return { rows: result.rows };
  },
  { schema },
);

// Export raw sqlite for migrations
export const rawDb = sqlite;
```

## Step 4: Database Migrations

Create `backend/database/migrations.ts`:

```typescript
import { rawDb } from "./db.ts";

export async function runMigrations() {
  try {
    // Create iron_session_storage table (required by OAuth package)
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

    // Create your app tables here
    // await rawDb.execute({ ... });

    console.log("Database migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
```

## Step 5: Storage Adapter

Create `backend/oauth/storage-adapter.ts`:

```typescript
import { DrizzleStorage } from "jsr:@tijs/atproto-oauth-hono@^0.2.6/drizzle";
import { db } from "../database/db.ts";

// Create singleton instance using Drizzle storage with our database
export const storage = new DrizzleStorage(db);
```

## Step 6: Main Application Setup

Create your main `backend/index.ts`:

```typescript
import { Hono } from "https://esm.sh/hono";
import { serveFile } from "https://esm.town/v/std/utils@85-main/index.ts";
import { createATProtoOAuth } from "jsr:@tijs/atproto-oauth-hono@^0.2.6";
import { storage } from "./oauth/storage-adapter.ts";
import { runMigrations } from "./database/migrations.ts";

const app = new Hono();

// Initialize database on startup
await runMigrations();

// Create OAuth instance
const oauth = createATProtoOAuth({
  baseUrl: "https://your-app.val.run", // Your Val.Town app URL
  cookieSecret: Deno.env.get("COOKIE_SECRET") || "fallback-secret",
  appName: "Your App Name",
  sessionTtl: 60 * 60 * 24, // 24 hours (REQUIRED!)
  storage,
});

// OAuth client metadata endpoint (required for AT Protocol)
app.get("/client-metadata.json", (c) => {
  const metadata = {
    "client_id": "https://your-app.val.run/client-metadata.json",
    "client_name": "Your App Name",
    "client_uri": "https://your-app.val.run",
    "redirect_uris": ["https://your-app.val.run/oauth/callback"],
    "scope": "atproto transition:generic",
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "application_type": "web",
    "token_endpoint_auth_method": "none",
    "dpop_bound_access_tokens": true,
  };
  return c.json(metadata);
});

// Mount OAuth routes (handles /login, /logout, /oauth/callback, /api/auth/session)
// @ts-ignore - Type instantiation too deep but works at runtime
app.route("/", oauth.routes);

// Your API endpoints
app.get("/api/example", async (c) => {
  // Get authenticated user
  const authResult = await getAuthenticatedUser(c);
  if (!authResult) {
    return c.json({ error: "Authentication required" }, 401);
  }

  const { did, oauthSession } = authResult;

  // Make authenticated requests to user's PDS
  const response = await oauthSession.makeRequest(
    "GET",
    `${oauthSession.pdsUrl}/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=app.bsky.feed.post`
  );

  return c.json(await response.json());
});

// Helper function for authentication
async function getAuthenticatedUser(c: any) {
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

// Serve static files
app.get("/frontend/*", (c) => serveFile(c.req.path, import.meta.url));
app.get("/", async (_c) => {
  return await serveFile("/frontend/index.html", import.meta.url);
});

export default app.fetch;
```

## Important Notes for Val.Town

### 1. Use sqlite2, not sqlite
```typescript
// ✅ Correct
import { sqlite } from "https://esm.town/v/std/sqlite2";

// ❌ Wrong
import { sqlite } from "https://esm.town/v/stevekrouse/sqlite";
```

### 2. sessionTtl is Required
```typescript
// ✅ Always include sessionTtl
const oauth = createATProtoOAuth({
  // ... other options
  sessionTtl: 60 * 60 * 24, // Required to prevent Iron Session errors
});

// ❌ Missing sessionTtl will cause "maxAge is invalid" errors
```

### 3. TypeScript Route Mounting
The route mounting may show TypeScript errors but works at runtime:
```typescript
// Add @ts-ignore to suppress type errors
// @ts-ignore - Type instantiation too deep but works at runtime
app.route("/", oauth.routes);
```

### 4. Environment Variables
Set your `COOKIE_SECRET` in Val.Town's environment variables section. This is crucial for session security.

## What You Get

After setup, your app automatically provides:

- **`/login?handle=user.bsky.social`** - OAuth login flow
- **`/logout`** - Clear session and logout
- **`/oauth/callback`** - OAuth callback handling
- **`/api/auth/session`** - Check authentication status
- **`/client-metadata.json`** - AT Protocol client metadata

## Next Steps

- [Frontend Integration Guide](./frontend-integration.md) - Learn how to handle auth in your React frontend
- [API Reference](./api-reference.md) - Explore all available methods
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions