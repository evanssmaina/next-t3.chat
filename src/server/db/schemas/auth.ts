import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey().notNull(),
  name: text(),
  email: text(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});
