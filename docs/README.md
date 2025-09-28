# @tijs/atproto-oauth-hono Documentation

Complete AT Protocol OAuth integration for Hono applications with built-in
session management and DPoP support.

## Table of Contents

- [Val.Town Integration Guide](./valtown-integration.md) - Complete setup guide
  for Val.Town
- [Configuration Reference](./configuration.md) - All available configuration
  options
- [Frontend Integration](./frontend-integration.md) - How to handle
  authentication in your frontend
- [API Reference](./api-reference.md) - Available methods and endpoints
- [Storage Adapters](./storage-adapters.md) - Database integration with Drizzle
  ORM
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
- [Migration Guide](./migration-guide.md) - Migrating from custom OAuth
  implementations

## Quick Start

```typescript
import { createATProtoOAuth } from "jsr:@tijs/atproto-oauth-hono@^0.2.6";
import { DrizzleStorage } from "jsr:@tijs/atproto-oauth-hono@^0.2.6/drizzle";

const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.town",
  cookieSecret: Deno.env.get("COOKIE_SECRET"),
  appName: "My App",
  sessionTtl: 60 * 60 * 24, // 24 hours
  storage: new DrizzleStorage(db),
});

app.route("/", oauth.routes);
```

## Platform Support

This package is designed to work seamlessly with:

- **Val.Town** (primary focus) - Complete integration guide available
- **Deno Deploy** - Works with minor configuration changes
- **Node.js** - Requires additional setup for Iron Session compatibility

For Val.Town users, start with the
[Val.Town Integration Guide](./valtown-integration.md).
