import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text().primaryKey().notNull(),
  name: text(),
  email: text().unique().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});
