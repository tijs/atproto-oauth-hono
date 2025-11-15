# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

ATProto OAuth integration library for Hono applications, providing plug-and-play
AT Protocol (Bluesky) OAuth authentication with web and mobile support. Built on
Deno, published to JSR.

## Development Commands

### Testing

- `deno test --allow-all` - Run all tests
- `deno task test` - Run all tests (alias)

### Code Quality

- `deno fmt` - Format code
- `deno fmt --check` - Check formatting without modifying
- `deno lint` - Lint code
- `deno task quality` - Format, lint, and test in one command
- `deno task ci` - Run CI checks (format check, lint, test)

### Publishing

- Automated via GitHub Actions when tags are pushed (see
  `.github/workflows/publish.yml`)
- Version is managed in `deno.json`

## Architecture

### Core Components

1. **Factory Pattern** (`src/oauth-factory.ts`)
   - `createATProtoOAuth()` is the main entry point
   - Creates and wires together the OAuth client, session manager, and routes
   - Validates required configuration and normalizes baseUrl
   - Defaults to MemoryStorage if no storage provided

2. **Route Handlers** (`src/oauth-routes.ts`)
   - Creates Hono app with all OAuth routes mounted
   - Integrates `OAuthClient` from `@tijs/oauth-client-deno`
   - Integrates `HonoOAuthSessions` from `@tijs/hono-oauth-sessions`
   - Handles both web (cookie-based) and mobile (Bearer token) authentication
   - Routes include: `/login`, `/oauth/callback`, `/client-metadata.json`,
     `/api/auth/session`, `/api/auth/mobile-start`, `/mobile/refresh-token`,
     `/api/auth/logout`, `/validate-session`

3. **Storage Abstraction** (`src/storage/`)
   - `interface.ts` - Defines `OAuthStorage` interface with `get()`, `set()`,
     `delete()` methods
   - `memory.ts` - In-memory storage (default, for development)
   - `sqlite.ts` - Raw SQLite storage (for Val.Town with sqlite2)
   - `drizzle.ts` - Drizzle ORM storage (separate export at `/drizzle`)
   - `schema.ts` - Drizzle table schema (separate export at `/drizzle`)

4. **Client Metadata** (`src/client-metadata.ts`)
   - Generates ATProto OAuth client metadata JSON
   - Served at `/client-metadata.json` endpoint
   - Includes app name, redirect URIs, mobile schemes, logo, policy URIs

5. **Type Definitions** (`src/types.ts`)
   - `ATProtoOAuthConfig` - Main configuration interface
   - `ATProtoOAuthInstance` - Return type with routes, session helpers,
     validation
   - `ClientMetadata` - OAuth client metadata structure
   - `SessionValidationResult` - Session validation response
   - Re-exports `OAuthSessionsInterface` from `@tijs/hono-oauth-sessions`

### Module Exports

- **Main export** (`mod.ts`): Core functionality, MemoryStorage, SQLiteStorage,
  OAuthStorage interface, error types
- **Drizzle export** (`drizzle.ts`): DrizzleStorage and ironSessionStorageTable
  schema (requires drizzle-orm)

This separation keeps the main package lightweight - drizzle-orm is only
imported when explicitly using `/drizzle` module.

### Key Dependencies

- `@tijs/oauth-client-deno` - Core OAuth client with DPoP support, session
  management, token refresh
- `@tijs/hono-oauth-sessions` - Hono-specific session management, cookie
  handling, mobile auth
- `@hono/hono` - Web framework
- `drizzle-orm` - Optional, only for Drizzle storage

### Authentication Flow

1. **Web Flow**: User redirects to `/login?handle=user.bsky.social` → OAuth flow
   → callback at `/oauth/callback` → cookie-based session
2. **Mobile Flow**: App POSTs to `/api/auth/mobile-start` with handle and
   code_challenge → gets authUrl → user completes OAuth in WebView → mobile app
   gets tokens via URL callback
3. **Session Management**: Both web and mobile sessions can be validated via
   `/api/auth/session` (cookies or Bearer token)
4. **Token Refresh**: Automatic refresh handled by underlying
   `@tijs/oauth-client-deno` when tokens expire

### Error Handling

The package re-exports typed errors from `@tijs/oauth-client-deno`:

- `SessionNotFoundError` - Session doesn't exist in storage
- `RefreshTokenExpiredError` - Refresh token has expired
- `RefreshTokenRevokedError` - Refresh token was revoked
- `NetworkError` - Network failure during OAuth operations
- `TokenExchangeError` - Failed to exchange authorization code for tokens
- `SessionError` - Generic session-related error

These errors are logged with specific types in
`oauth-routes.ts:validateSession()` for debugging.

## Testing Guidelines

- Tests use Deno's built-in test runner and `@std/assert`
- All tests must be self-contained with no external dependencies
- Use MemoryStorage for tests to avoid database dependencies
- Test files in `tests/` directory
- Mock the OAuth flow rather than making real network calls
- Coverage includes factory configuration, client metadata generation, storage
  implementations, session exposure

## Security Requirements

- OAuth flows must strictly follow ATProto specifications - no workarounds
- Cookie secrets should come from environment variables in production
- Session TTLs should be appropriate for use case (shorter for high-security,
  30+ days for mobile)
- DPoP tokens are handled automatically by underlying libraries
- All authenticated requests use `oauthSession.makeRequest()` for proper DPoP
  handling

## Val.Town Specific Notes

- This package is optimized for Val.Town deployment
- Use `SQLiteStorage` with Val.Town's `sqlite2` (not `sqlite`)
- For Drizzle ORM on Val.Town, use `sqlite-proxy` driver
- Set `COOKIE_SECRET` environment variable in Val.Town secrets
- Mobile schemes must be registered in app's URL scheme configuration

## Documentation

- All public APIs have comprehensive JSDoc comments
- JSDoc appears in JSR documentation: https://jsr.io/@tijs/atproto-oauth-hono
- Examples in `examples/` directory show basic and mobile integration patterns
- README has complete integration guide with storage options

## Code Style

- Max line length enforced by `deno fmt`
- Explicit types for public APIs
- `noImplicitAny: false` in compiler options (allows `any` where needed)
- No `console.log()` - use proper logging (though console.error is acceptable
  for errors)
- File structure: Keep files focused and under 500 lines
