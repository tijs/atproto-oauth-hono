/**
 * In-memory storage implementation for OAuth sessions
 * Perfect for testing and development
 */

import type { OAuthStorage } from "./interface.ts";

/**
 * In-memory storage for OAuth sessions and tokens
 */
export class MemoryStorage implements OAuthStorage {
  private data = new Map<string, { value: any; expiresAt?: number }>();

  get<T = unknown>(key: string): Promise<T | null> {
    const item = this.data.get(key);
    if (!item) return Promise.resolve(null);
    if (item.expiresAt && item.expiresAt <= Date.now()) {
      this.data.delete(key);
      return Promise.resolve(null);
    }
    return Promise.resolve(item.value);
  }

  set<T = unknown>(
    key: string,
    value: T,
    options?: { ttl?: number },
  ): Promise<void> {
    const expiresAt = options?.ttl
      ? Date.now() + (options.ttl * 1000)
      : undefined;
    this.data.set(key, { value, expiresAt });
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.data.delete(key);
    return Promise.resolve();
  }
}
