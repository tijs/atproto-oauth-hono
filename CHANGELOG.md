# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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