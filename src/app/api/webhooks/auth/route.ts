import { env } from "@/env";
import { logger } from "@/lib/logger";
import { redis } from "@/lib/redis";
import { db, eq, user } from "@/server/db";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { type NextRequest, NextResponse } from "next/server";

// Error codes
const UNIQUE_CONSTRAINT_ERROR = "23505";
const EMAIL_UNIQUE_CONSTRAINT = "users_email_unique";

const WEBHOOK_PROCESSED_PREFIX = "dashboard:webhook-processed:";
const WEBHOOK_TTL = 60 * 60 * 24 * 7; // 7 days in seconds

const log = logger.child({ module: "api/webhooks/auth" });

export async function POST(req: NextRequest) {
  log.info("Starting webhook");
  const evt = await verifyWebhook(req, {
    signingSecret: env.CLERK_WEBHOOK_SIGNING_SECRET,
  });

  const eventId = evt.data.id;
  const eventType = evt.type;

  log.info(
    `Received webhook with ID ${eventId} and event type of ${eventType}`,
  );
  log.info("Webhook payload:", evt.data);

  if (!eventId) {
    log.error("Missing event ID in webhook");
    return new NextResponse("Invalid webhook data", { status: 400 });
  }

  const processedKey = `${WEBHOOK_PROCESSED_PREFIX}${eventId}`;

  try {
    // Atomic check-and-set to prevent race conditions
    const wasSet = await redis.set(processedKey, "processing", {
      ex: WEBHOOK_TTL,
      nx: true, // Only set if key doesn't exist
    });

    if (!wasSet) {
      log.info("Webhook already processed or being processed:", { eventId });
      return new NextResponse("Webhook received", { status: 200 });
    }

    // Process the webhook events inline
    switch (eventType) {
      case "user.created": {
        await db.transaction(async (tx) => {
          const userId = evt.data.id as string;
          const email = evt.data?.email_addresses[0]?.email_address;

          if (!userId) {
            log.error("Missing user ID in webhook data");
            throw new Error("Missing user ID in webhook data");
          }

          // Check if user exists by ID or email
          const [existingUserById, existingUserByEmail] = await Promise.all([
            tx.query.user.findFirst({ where: eq(user.id, userId) }),
            email
              ? tx.query.user.findFirst({ where: eq(user.email, email) })
              : null,
          ]);

          if (existingUserById) {
            log.warn("User already exists by ID:", { userId });
            return;
          }

          if (existingUserByEmail) {
            log.warn("User with email already exists:", { email });
            return;
          }

          const firstName = evt.data.first_name || "";
          const lastName = evt.data.last_name || "";
          const fullName = lastName
            ? `${firstName} ${lastName}`.trim()
            : firstName.trim();

          log.info("Creating user in database:", { userId });
          await tx.insert(user).values({
            id: userId,
            name: fullName,
            email: email,
            createdAt: new Date(evt.data.created_at),
            updatedAt: new Date(evt.data.updated_at),
          });

          log.info("User created successfully in database:", { userId });
        });
        break;
      }

      case "user.updated": {
        await db.transaction(async (tx) => {
          const userId = evt.data.id as string;
          const email = evt.data.email_addresses[0]?.email_address as string;

          if (!userId) {
            log.error("Missing user ID in webhook data");
            throw new Error("Missing user ID in webhook data");
          }

          const [existingUser, existingUserByEmail] = await Promise.all([
            tx.query.user.findFirst({ where: eq(user.id, userId) }),
            email
              ? tx.query.user.findFirst({ where: eq(user.email, email) })
              : null,
          ]);

          const firstName = evt.data.first_name || "";
          const lastName = evt.data.last_name || "";
          const fullName = lastName
            ? `${firstName} ${lastName}`.trim()
            : firstName.trim();

          if (existingUser) {
            const shouldUpdateEmail =
              !existingUserByEmail || existingUserByEmail.id === userId;

            log.info("Updating existing user in database:", { userId });
            await tx
              .update(user)
              .set({
                name: fullName,
                ...(shouldUpdateEmail && email ? { email } : {}),
                updatedAt: new Date(evt.data.updated_at),
              })
              .where(eq(user.id, userId));

            log.info("User updated successfully in database:", { userId });
          } else if (existingUserByEmail) {
            log.warn("Cannot create user with duplicate email:", { email });
          } else {
            // Create user if it doesn't exist
            await tx.insert(user).values({
              id: userId,
              name: fullName,
              email: email,
              createdAt: new Date(evt.data.created_at || Date.now()),
              updatedAt: new Date(evt.data.updated_at || Date.now()),
            });

            log.info("User created during update event:", { userId });
          }
        });
        break;
      }

      case "user.deleted": {
        await db.transaction(async (tx) => {
          const userId = evt.data.id as string;

          if (!userId) {
            log.error("Missing user ID in webhook data");
            throw new Error("Missing user ID in webhook data");
          }

          log.info("Checking if user exists in database:", { userId });
          const existingUser = await tx.query.user.findFirst({
            where: eq(user.id, userId),
          });

          if (existingUser) {
            log.info("User found for deletion:", { userId });
            log.info("Deleting user from database:", { userId });
            await tx.delete(user).where(eq(user.id, userId));
            log.info("User deleted successfully from database:", { userId });
          } else {
            log.info("User not found for deletion:", { userId });
          }
        });
        break;
      }

      default:
        log.warn(`Unhandled event type: ${eventType}`);
        break;
    }

    // Mark as completed
    log.info("Marking webhook as completed:", { eventId });
    await redis.set(processedKey, "completed", { ex: WEBHOOK_TTL });

    log.info("Finished processing webhook successfully");
    return new NextResponse("Webhook received", { status: 200 });
  } catch (err: any) {
    log.error("Error processing webhook:", {
      eventId,
      eventType,
      error: err,
      endpont: "/api/webhooks/auth",
    });

    log.error("Finished processing webhook with error");
    // Clean up processing lock on error
    try {
      log.info("Cleaning up processing lock in redis:", { eventId });
      await redis.del(processedKey);
    } catch (cleanupErr) {
      log.error("Failed to cleanup processing lock in redis:", {
        cleanupErr,
        endpoint: "/api/webhooks/auth",
      });
    }

    // Handle specific error types
    if (err?.code === UNIQUE_CONSTRAINT_ERROR) {
      if (err?.constraint === EMAIL_UNIQUE_CONSTRAINT) {
        log.error(
          "Duplicate email constraint violation - likely race condition",
        );
        // Mark as completed to prevent retries
        await redis.set(processedKey, "completed", { ex: WEBHOOK_TTL });
        return new NextResponse("Webhook processed", { status: 200 });
      }
    }

    log.error("Finished processing webhook with error");
    return new NextResponse("Error processing webhook", { status: 500 });
  }
}
