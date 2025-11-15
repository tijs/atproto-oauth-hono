# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2025-01-15

### Fixed

- Re-export `SessionInterface` type from `hono-oauth-sessions` for better
  developer experience
  - Applications can now import `SessionInterface` directly from
    `@tijs/atproto-oauth-hono`
  - Fixes type checking errors when using `SessionInterface` in application code

## [2.0.0] - 2025-01-15

### Added

- **`getProfile(did)` Helper**: New AT Protocol-specific helper for fetching
  user profile data
  - Handles PDS endpoint details internally
  - Returns full profile data: displayName, avatar, banner, follower counts,
    etc.
  - Returns null if session invalid or profile not found
  - Example: `const profile = await oauth.getProfile(userDid);`
- **`ProfileData` Type**: Comprehensive type for AT Protocol profile data

### Removed (BREAKING CHANGES)

- **Profile Data from Validation**: Removed automatic profile data fetching from
  session validation
  - `SessionValidationResult` no longer includes `displayName` or `avatar`
    fields
  - `/api/auth/session` endpoint no longer returns profile data
  - Use `getProfile(did)` helper instead when profile data is needed

### Changed

- **Dependency Update**: Updated to `@tijs/hono-oauth-sessions@^2.0.0` which
  implements minimal session management:
  - Removed automatic token refresh from validateSession()
  - Removed automatic profile fetching from handleCallback()
  - Token refresh now handled solely by oauth-client-deno's restore() method
  - Profile fetching moved to AT Protocol-specific layer (this package)

### Improved

- **Clean Architecture**: Clear separation of concerns
  - hono-oauth-sessions: Generic OAuth session management
  - atproto-oauth-hono: AT Protocol-specific features (like profile fetching)
- **Flexibility**: Applications fetch profile data only when needed using
  `getProfile()`
- **Better Abstraction**: Applications don't need to know about PDS endpoints or
  XRPC

### Migration Guide

**Profile Data**: Use the new `getProfile()` helper

```typescript
// Before (automatic in validation):
const session = await oauth.validateSession(request);
console.log(session.displayName, session.avatar);

// After (use getProfile helper):
const session = await oauth.validateSession(request);
if (session.valid) {
  const profile = await oauth.getProfile(session.did);
  if (profile) {
    console.log(profile.displayName, profile.avatar);
  }
}
```

**Benefits of new approach:**

- Fetch profile data only when needed (better performance)
- Get complete profile data (banner, follower counts, etc.)
- No need to know about PDS endpoints or XRPC
- AT Protocol-specific logic stays in AT Protocol-specific package

**Token Refresh**: Now automatic via oauth-client-deno

Token refresh is still automatic, but now handled by the OAuth client's
`restore()` method when you call `oauth.sessions.getOAuthSession(did)` or
`oauth.getProfile(did)`. No code changes needed, just be aware the
responsibility has moved to the correct layer.

## [1.2.0] - 2025-01-15

### Added

- **Logger Configuration**: New optional `logger` parameter in
  `ATProtoOAuthConfig`
  - Enables debugging and monitoring of OAuth flows
  - Defaults to no-op logger (no console output)
  - Can pass `console` for standard logging or implement custom `Logger`
    interface
  - Example: `logger: console` to enable console logging
- **Type Re-export**: Added `Logger` type re-export from
  `@tijs/hono-oauth-sessions` for custom logger implementations

### Changed

- **Dependency Update**: Updated to `@tijs/hono-oauth-sessions@^1.2.0` which
  includes:
  - Configurable logging system (replaces hardcoded console.log statements)
  - Improved cookie secret validation (enforces 32-character minimum)
  - Better type safety (removed "fake session" objects and type casts)
  - Fixed cookie parsing to handle `=` characters in cookie values correctly

### Improved

- **Production Readiness**: Applications can now disable debug logging in
  production by not providing a logger
- **Developer Experience**: Better debugging capabilities with configurable
  logging
- **Error Messages**: Enhanced cookie secret validation provides clearer
  guidance when secrets are too short

### Migration Guide

No code changes required - this is a fully backwards compatible update. Existing
applications will continue to work without any modifications.

**Optional: Enable Logging**

```typescript
const oauth = createATProtoOAuth({
  baseUrl: "https://myapp.val.run",
  appName: "My App",
  logger: console, // NEW: Enable console logging for debugging
});
```

## [1.1.0] - 2025-01-14

### Changed

- **Dependency Update**: Updated to `@tijs/hono-oauth-sessions@^1.1.0` for
  enhanced session helper methods

### Added

- **Documentation Enhancement**: New "Protected Routes with Session Helpers"
  section in README
  - Complete example showing `oauth.sessions.getOAuthSessionFromRequest()`
  - Example showing `oauth.sessions.getClearCookieHeader()` usage
  - Explains automatic cookie extraction, unsealing, and token refresh
- **Improved Developer Experience**: Applications can now use convenience
  helpers from the underlying `hono-oauth-sessions` package without implementing
  cookie handling logic

### Improved

- **Example Code Quality**: README now demonstrates best practices for
  authenticated route handlers
- **API Clarity**: Better documentation of what the `oauth.sessions` object
  provides

## [1.0.2] - 2025-01-14

### Added

- **Error Type Re-exports**: Now re-exports all OAuth error types from
  `oauth-client-deno` to prevent consumers from needing direct dependencies on
  internal implementation libraries
  - `SessionNotFoundError`
  - `RefreshTokenExpiredError`
  - `RefreshTokenRevokedError`
  - `NetworkError`
  - `TokenExchangeError`
  - `SessionError`

### Improved

- **API Design**: Consumers can now import error types directly from this
  package instead of reaching into `@tijs/oauth-client-deno`, following proper
  facade pattern principles
- **Decoupling**: Applications are no longer tightly coupled to the underlying
  OAuth client implementation

### Migration Guide

**Before (v1.0.1):**

```typescript
import { createATProtoOAuth } from "jsr:@tijs/atproto-oauth-hono@^1.0.1";
import {
  RefreshTokenExpiredError,
  SessionNotFoundError,
} from "jsr:@tijs/oauth-client-deno@^3.0.0"; // Direct dependency on internal lib
```

**After (v1.0.2):**

```typescript
import {
  createATProtoOAuth,
  RefreshTokenExpiredError,
  SessionNotFoundError,
} from "jsr:@tijs/atproto-oauth-hono@^1.0.2"; // All from one package
```

## [1.0.1] - 2025-01-11

### Added

- **Enhanced Error Logging**: `validateSession()` helper now logs specific error
  types for better debugging
- Import typed error classes from oauth-client-deno for proper error handling

### Improved

- **Error Diagnostics**: Session validation failures now log specific error
  types (SessionNotFoundError, RefreshTokenExpiredError, etc.) instead of
  generic errors

## [1.0.0] - 2025-01-11

### Changed

- **BREAKING**: Updated to `@tijs/oauth-client-deno@^3.0.0` which throws typed
  errors
- **BREAKING**: Updated to `@tijs/hono-oauth-sessions@^1.0.0` which propagates
  OAuth errors
- **Error Handling**: OAuth session errors now propagate to calling code for
  better visibility

### Improved

- **Error Diagnostics**: Applications using this package now receive typed
  errors (`SessionNotFoundError`, `RefreshTokenExpiredError`, etc.) instead of
  null returns
- **Debugging**: Enhanced error visibility makes it easier to diagnose OAuth
  authentication issues

### Migration Guide

No code changes required in applications using this package as a facade. The
package continues to export the same API, but now with enhanced error handling
that propagates from the underlying OAuth libraries.

## [0.4.0] - 2025-10-27

### Added

- **Custom Redirect Support**: `/login` route now accepts a `redirect` query
  parameter to specify post-OAuth destination
- **OAuth Flow Enhancement**: Redirect parameter is passed through to
  `hono-oauth-sessions` for proper state management

### Changed

- **Dependency Update**: Updated `@tijs/hono-oauth-sessions` to ^0.5.0 which
  includes redirect path support
- **Login Flow**: Users can now be redirected back to their intended destination
  after OAuth completion

### Fixed

- **Bookmarklet Flow**: Fixes issue where users trying to access protected pages
  while logged out would lose their context after authentication

## [0.3.2] - 2025-01-17

### Changed

- **Dependency Update**: Updated `@tijs/oauth-client-deno` to ^2.1.0 which
  includes concurrency-safe session restore
  - Fixes race conditions when multiple concurrent requests try to restore the
    same session during token refresh
  - Prevents intermittent "OAuth session not found" errors in multi-endpoint
    applications
  - No breaking changes - fully backwards compatible

### Fixed

- **Race Condition**: Resolved intermittent 503 errors when tags and bookmarks
  endpoints loaded simultaneously and session was expired

## [0.3.1] - 2025-09-30

### Changed

- **Dependency Update**: Updated `@tijs/hono-oauth-sessions` to 0.4.1 which
  includes automatic user profile fetching (avatar and displayName) during OAuth
  callback
- **Enhanced UX**: User avatars are now automatically available in session data
  without requiring separate API calls

### Added

- **Profile Data**: Session validation responses now include user avatar and
  displayName from OAuth callback

## [0.3.0] - 2025-09-30

### Changed

- **Dependency Update**: Updated `@tijs/hono-oauth-sessions` to 0.4.0 which
  includes required `makeRequest()` method for proper DPoP support
- **Type Safety**: Improved TypeScript types through dependency update ensuring
  all sessions have DPoP authentication methods

### Notes

This update brings proper DPoP authentication guarantees through the type
system. All OAuth sessions returned by `sessions.getOAuthSession()` now have
guaranteed `makeRequest()` method for authenticated PDS operations.

## [0.2.9] - 2025-09-28

### Fixed

- **Documentation Links**: Updated JSDoc documentation link to point to JSR docs
  instead of removed docs directory
- **README Updates**: Updated all import examples to use latest version ^0.2.8
- **JSR Integration**: Improved documentation experience with proper JSR links

## [0.2.8] - 2025-09-28

### Changed

- **JSDoc Documentation**: Migrated all documentation from separate markdown
  files to comprehensive JSDoc comments for better JSR integration
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
