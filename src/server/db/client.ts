import { env } from "@/env";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { withReplicas } from "drizzle-orm/pg-core";
import ws from "ws";
import * as schema from "./schemas";

neonConfig.webSocketConstructor = ws;

const primaryPool = new Pool({ connectionString: env.DATABASE_URL });

const readReplicaPool = new Pool({
  connectionString: env.DATABASE_URL_READ_REPLICA,
});

const primaryDb = drizzle({
  client: primaryPool,
  schema,
  casing: "snake_case",
});

const readReplica = drizzle({
  client: readReplicaPool,
  schema: schema,
  casing: "snake_case",
});

export const db = withReplicas(primaryDb, [readReplica]);
