/**
 * Storage interface for OAuth sessions and tokens
 * Compatible with @tijs/oauth-client-deno and @tijs/hono-oauth-sessions
 */
export interface OAuthStorage {
  /**
   * Retrieve a value from storage
   */
  get<T = unknown>(key: string): Promise<T | null>;

  /**
   * Store a value in storage with optional TTL
   */
  set<T = unknown>(
    key: string,
    value: T,
    options?: { ttl?: number },
  ): Promise<void>;

  /**
   * Delete a value from storage
   */
  delete(key: string): Promise<void>;
}
