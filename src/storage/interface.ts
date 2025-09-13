/**
 * Storage interface for OAuth sessions and tokens
 * Compatible with @tijs/oauth-client-deno and @tijs/hono-oauth-sessions
 */
export interface OAuthStorage {
  /**
   * Check if a key exists in storage
   */
  hasItem(key: string): Promise<boolean>;

  /**
   * Get an item from storage
   */
  getItem<T = any>(key: string): Promise<T | null>;

  /**
   * Store an item with optional TTL
   */
  setItem(key: string, value: any, options?: { ttl?: number }): Promise<void>;

  /**
   * Remove an item from storage
   */
  removeItem(key: string): Promise<void>;

  /**
   * Get all keys in storage
   */
  getKeys(): Promise<string[]>;

  /**
   * Clear all items from storage
   */
  clear(): Promise<void>;

  /**
   * Clean up expired entries
   */
  cleanup?(): Promise<void>;

  // Aliases for OAuth client compatibility
  get: <T = any>(key: string) => Promise<T | null>;
  set: (key: string, value: any, options?: { ttl?: number }) => Promise<void>;
  del: (key: string) => Promise<void>;
  delete: (key: string) => Promise<void>;
}
