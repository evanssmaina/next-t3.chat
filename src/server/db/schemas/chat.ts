import { generateId } from "@/utils/generate-id";
import type { Message } from "ai";
import { index, json, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const chat = pgTable(
  "chat",
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId("chat")),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text().default("(New Chat)"),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index().on(table.userId),
    };
  },
);

export const message = pgTable(
  "message",
  {
    id: text("id").primaryKey(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    chatId: text()
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    aiModel: text().notNull(),
    role: text().$type<Message["role"]>().notNull(),
    content: text().$type<Message["content"]>().notNull(),
    annotations: json().$type<Message["annotations"]>().notNull(),
    parts: json("parts").$type<Message["parts"]>().notNull(),
    experimental_attachments: json()
      .$type<Message["experimental_attachments"]>()
      .notNull(),
    createdAt: timestamp({ mode: "date" })
      .$type<Message["createdAt"]>()
      .notNull(),
  },
  (table) => {
    return {
      chatIdIdx: index().on(table.chatId),
      userIdIdx: index().on(table.userId),
    };
  },
);
