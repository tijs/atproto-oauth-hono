/**
 * Database schema for OAuth session storage
 * Matches location-feed-generator schema structure
 */

import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ironSessionStorageTable: any = sqliteTable(
  "iron_session_storage",
  {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
);
