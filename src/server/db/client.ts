import { env } from "@/env";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schemas";

neonConfig.webSocketConstructor = ws;

export const db = drizzle({
  client: new Pool({ connectionString: env.DATABASE_URL }),
  schema,
  logger: true,
  casing: "snake_case",
});
