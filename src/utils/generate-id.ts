import { customAlphabet } from "nanoid";

export const nanoid = customAlphabet(
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
);

const prefixes = {
  chat: "chat",
} as const;

export function generateId(prefix: keyof typeof prefixes, length = 16): string {
  return [prefixes[prefix], nanoid(length)].join("_");
}
