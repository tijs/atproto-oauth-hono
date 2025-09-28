# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.8] - 2025-09-28

### Changed

- **JSDoc Documentation**: Migrated all documentation from separate markdown files
  to comprehensive JSDoc comments for better JSR integration
- **Enhanced Developer Experience**: Documentation now appears in JSR's docs tab
  with proper symbol documentation and IntelliSense support
- **Consolidated Documentation**: Single source of truth - no duplicate
  documentation to maintain

### Removed

- **Markdown Documentation Files**: Removed `docs/` directory - all content
  migrated to JSDoc comments in source code

### Improved

- **Module Documentation**: Enhanced module-level docs with complete Val.Town
  examples and setup instructions
- **Function Documentation**: Comprehensive JSDoc with multiple usage examples
  and troubleshooting guidance
- **Type Documentation**: Enhanced interface docs with validation notes and
  common error prevention tips

## [0.2.7] - 2025-09-28

### Added

- **Comprehensive Documentation**: Added complete documentation suite focused on
  Val.Town integration
  - `docs/README.md`: Package overview and quick start guide
  - `docs/valtown-integration.md`: Complete Val.Town setup walkthrough with
    database configuration and common patterns
  - `docs/frontend-integration.md`: React authentication patterns and
    cookie-based auth implementation
  - `docs/configuration.md`: All configuration options and environment setup
  - `docs/api-reference.md`: Complete API documentation with examples
  - `docs/troubleshooting.md`: Common issues and solutions based on real-world
    integration experience
- **Val.Town Compatibility Guide**: Detailed guidance on sqlite2 vs sqlite
  usage, sessionTtl requirements, and TypeScript workarounds
- **Authentication Patterns**: Complete examples for cookie-based auth,
  `credentials: "include"` usage, and session management

## [0.2.6] - 2025-09-17

### Added

- **Type Re-exports**: Added `OAuthSessionsInterface` re-export from
  `hono-oauth-sessions` for convenience and proper dependency management

## [0.2.5] - 2025-09-17

### Fixed

- **Complete Type Coverage**: Updated to `@tijs/hono-oauth-sessions@0.3.1` with
  complete `OAuthSessionsInterface` including all public methods
- **Test Compatibility**: All session method tests now pass with proper type
  checking

## [0.2.4] - 2025-09-17

### Added

- **Enhanced Type Safety**: Updated `sessions` property type from `any` to
  `OAuthSessionsInterface` for better TypeScript support
- **Dependency Updates**: Updated to `@tijs/oauth-client-deno@2.0.0` and
  `@tijs/hono-oauth-sessions@0.3.0`

### Fixed

- **Type Safety**: Improved IntelliSense and compile-time type checking for
  OAuth session operations

## [0.2.3] - 2025-01-13

### Added

- **Session TTL Configuration**: Added `sessionTtl` option to
  `ATProtoOAuthConfig` to control session duration
- **Mobile App Support**: Extended session duration configuration with
  recommendation for 30+ day sessions for mobile apps
- **Documentation**: Added comprehensive "Session Configuration" section to
  README with examples for different use cases

### Changed

- **Breaking**: Session configuration is now exposed - existing apps will
  continue using 7-day default

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
