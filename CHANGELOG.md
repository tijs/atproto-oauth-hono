# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2025-01-13

### Fixed

- Added proper module documentation with `@module` tag for all entrypoints to
  satisfy JSR requirements

## [0.2.1] - 2025-01-13

### Fixed

- JSR linting compatibility by using bare specifiers in import maps instead of
  inline URLs
- Added `no-slow-types` rule for better JSR compatibility
- Added `ci` and `fmt-check` tasks for local JSR-style validation

## [0.2.0] - 2025-01-13

### Changed

- **BREAKING**: Redesigned storage to be pluggable with standard `OAuthStorage`
  interface
- Made drizzle-orm optional by moving it to separate `/drizzle` export module
- Updated all storage implementations to use consistent `get()`, `set()`,
  `delete()` methods
- DrizzleStorage and ironSessionStorageTable now exported from separate
  `/drizzle` module
- Factory function now accepts `storage` parameter instead of `database`

### Added

- `MemoryStorage` class for development and testing (now the default)
- `SQLiteStorage` class for raw SQLite databases (e.g., Val.Town)
- Separate `jsr:@tijs/atproto-oauth-hono/drizzle` export for Drizzle ORM users
- `OAuthStorage` interface export for custom storage implementations
- Comprehensive storage documentation with usage examples

### Improved

- Main package functionality doesn't require drizzle-orm imports
- Drizzle ORM only used when explicitly importing from `/drizzle` module
- Better separation of concerns between storage implementations
- More flexible architecture for different deployment environments

### Migration Guide

**Before (v0.1.0):**

```typescript
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.town",
  appName: "My App",
  // Used hardcoded Drizzle storage
});
```

**After (v0.2.0):**

```typescript
// Option 1: Use default MemoryStorage (development)
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.town",
  appName: "My App",
});

// Option 2: Use SQLiteStorage (Val.Town)
import { SQLiteStorage } from "jsr:@tijs/atproto-oauth-hono";
const storage = new SQLiteStorage(sqlite);
const oauth = createATProtoOAuth({
  /* config */,
  storage
});

// Option 3: Use DrizzleStorage (requires separate import)
import { DrizzleStorage } from "jsr:@tijs/atproto-oauth-hono/drizzle";
const storage = new DrizzleStorage(db);
const oauth = createATProtoOAuth({
  /* config */,
  storage
});
```

## [0.1.0] - 2025-01-13

### Added

- Initial release of @tijs/atproto-oauth-hono
- Complete ATProto OAuth integration for Hono applications on Val.Town
- Plug-and-play OAuth setup with configurable client metadata
- Web and mobile OAuth flows with custom URL scheme support
- Session management with automatic token refresh
- Val.Town SQLite storage integration
- Comprehensive TypeScript types and interfaces
- Production-tested code extracted from location-feed-generator
- Complete test suite with 14 unit tests
- Examples for basic web app and mobile app integration
- GitHub Action for automated JSR publishing

### Features

- `createATProtoOAuth()` factory function for easy setup
- Built-in routes: `/login`, `/oauth/callback`, `/client-metadata.json`
- Session validation endpoints: `/api/auth/session`, `/validate-session`
- Mobile OAuth endpoints: `/api/auth/mobile-start`, `/mobile/refresh-token`
- Logout functionality: `/api/auth/logout`
- Configurable mobile URL schemes for custom app integration
- Automatic base URL normalization and validation
- Compatible with @tijs/oauth-client-deno and @tijs/hono-oauth-sessions
