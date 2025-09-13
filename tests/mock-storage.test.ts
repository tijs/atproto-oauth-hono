import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import type { OAuthStorage } from "../src/storage/interface.ts";

/**
 * Mock storage implementation for testing
 */
class MockStorage implements OAuthStorage {
  private data = new Map<string, { value: any; expiresAt?: number }>();

  hasItem(key: string): Promise<boolean> {
    const item = this.data.get(key);
    if (!item) return Promise.resolve(false);
    if (item.expiresAt && item.expiresAt <= Date.now()) {
      this.data.delete(key);
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  }

  getItem<T = any>(key: string): Promise<T | null> {
    const item = this.data.get(key);
    if (!item) return Promise.resolve(null);
    if (item.expiresAt && item.expiresAt <= Date.now()) {
      this.data.delete(key);
      return Promise.resolve(null);
    }
    return Promise.resolve(item.value);
  }

  setItem(
    key: string,
    value: any,
    options?: { ttl?: number },
  ): Promise<void> {
    const expiresAt = options?.ttl
      ? Date.now() + (options.ttl * 1000)
      : undefined;
    this.data.set(key, { value, expiresAt });
    return Promise.resolve();
  }

  removeItem(key: string): Promise<void> {
    this.data.delete(key);
    return Promise.resolve();
  }

  getKeys(): Promise<string[]> {
    const now = Date.now();
    const validKeys: string[] = [];

    for (const [key, item] of this.data.entries()) {
      if (!item.expiresAt || item.expiresAt > now) {
        validKeys.push(key);
      } else {
        this.data.delete(key);
      }
    }

    return Promise.resolve(validKeys);
  }

  clear(): Promise<void> {
    this.data.clear();
    return Promise.resolve();
  }

  cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, item] of this.data.entries()) {
      if (item.expiresAt && item.expiresAt <= now) {
        this.data.delete(key);
      }
    }
    return Promise.resolve();
  }

  get = this.getItem;
  set = this.setItem;
  del = this.removeItem;
  delete = this.removeItem;
}

Deno.test("MockStorage - basic operations", async () => {
  const storage = new MockStorage();

  // Test setItem and getItem
  await storage.setItem("test", "value");
  assertEquals(await storage.getItem("test"), "value");

  // Test hasItem
  assertEquals(await storage.hasItem("test"), true);
  assertEquals(await storage.hasItem("nonexistent"), false);

  // Test removeItem
  await storage.removeItem("test");
  assertEquals(await storage.getItem("test"), null);
  assertEquals(await storage.hasItem("test"), false);
});

Deno.test("MockStorage - TTL expiration", async () => {
  const storage = new MockStorage();

  // Set item with 1 second TTL
  await storage.setItem("expiring", "value", { ttl: 0.001 }); // 1ms

  // Should exist immediately
  assertEquals(await storage.hasItem("expiring"), true);
  assertEquals(await storage.getItem("expiring"), "value");

  // Wait for expiration
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Should be expired
  assertEquals(await storage.hasItem("expiring"), false);
  assertEquals(await storage.getItem("expiring"), null);
});

Deno.test("MockStorage - JSON serialization", async () => {
  const storage = new MockStorage();

  const obj = { name: "test", value: 123 };
  await storage.setItem("object", obj);

  const retrieved = await storage.getItem("object");
  assertEquals(retrieved, obj);
});

Deno.test("MockStorage - getKeys", async () => {
  const storage = new MockStorage();

  await storage.setItem("key1", "value1");
  await storage.setItem("key2", "value2");
  await storage.setItem("expiring", "value", { ttl: 0.001 });

  // Wait for expiring key to expire
  await new Promise((resolve) => setTimeout(resolve, 10));

  const keys = await storage.getKeys();
  assertEquals(keys.sort(), ["key1", "key2"]);
});

Deno.test("MockStorage - cleanup", async () => {
  const storage = new MockStorage();

  await storage.setItem("permanent", "value");
  await storage.setItem("expiring", "value", { ttl: 0.001 });

  // Wait for expiration
  await new Promise((resolve) => setTimeout(resolve, 10));

  await storage.cleanup();

  assertEquals(await storage.hasItem("permanent"), true);
  assertEquals(await storage.hasItem("expiring"), false);
});
