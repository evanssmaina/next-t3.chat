import { pino } from "pino";
import { env } from "../env";

const isDev = process.env.NODE_ENV === "development";

export const logger = pino({
  level: isDev ? "debug" : "info",
  base: {
    service: "nt3",
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : {
        targets: [
          {
            target: "@axiomhq/pino",
            options: {
              dataset: env.NEXT_PUBLIC_AXIOM_DATASET,
              token: env.NEXT_PUBLIC_AXIOM_TOKEN,
            },
          },
        ],
      },
});
