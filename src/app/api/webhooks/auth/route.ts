import { redis } from "@/lib/redis";
import { db, eq, user } from "@/server/db";
import { logger } from "@/utils/logger";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { type NextRequest, NextResponse } from "next/server";

// Error codes
const UNIQUE_CONSTRAINT_ERROR = "23505";
const EMAIL_UNIQUE_CONSTRAINT = "users_email_unique";

const WEBHOOK_PROCESSED_PREFIX = "dashboard:webhook-processed:";
const WEBHOOK_TTL = 60 * 60 * 24 * 7; // 7 days in seconds

export async function POST(req: NextRequest) {
  let evt;

  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    logger("Webhook verification failed:", err);
    return new NextResponse("Invalid webhook", { status: 401 });
  }

  const eventId = evt.data.id;
  const eventType = evt.type;

  if (!eventId) {
    logger("Missing event ID in webhook");
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
      logger("Webhook already processed or being processed:", eventId);
      return new NextResponse("Webhook received", { status: 200 });
    }

    // Process the webhook
    await processWebhookEvent(evt, eventType);

    // Mark as completed
    await redis.set(processedKey, "completed", { ex: WEBHOOK_TTL });

    return new NextResponse("Webhook received", { status: 200 });
  } catch (err: any) {
    logger("Error processing webhook:", { eventId, eventType, error: err });

    // Clean up processing lock on error
    try {
      await redis.del(processedKey);
    } catch (cleanupErr) {
      logger("Failed to cleanup processing lock:", cleanupErr);
    }

    // Handle specific error types
    if (err?.code === UNIQUE_CONSTRAINT_ERROR) {
      if (err?.constraint === EMAIL_UNIQUE_CONSTRAINT) {
        logger("Duplicate email constraint violation - likely race condition");
        // Mark as completed to prevent retries
        await redis.set(processedKey, "completed", { ex: WEBHOOK_TTL });
        return new NextResponse("Webhook processed", { status: 200 });
      }
    }

    return new NextResponse("Error processing webhook", { status: 500 });
  }
}

async function processWebhookEvent(evt: any, eventType: string) {
  switch (eventType) {
    case "user.created":
      return await handleUserCreated(evt);
    case "user.updated":
      return await handleUserUpdated(evt);
    case "user.deleted":
      return await handleUserDeleted(evt);
    default:
      logger(`Unhandled event type: ${eventType}`);
      return;
  }
}

async function handleUserCreated(evt: any) {
  return await db.transaction(async (tx) => {
    const userId = evt.data.id as string;
    const email = evt.data.email_addresses[0]?.email_address as string;

    if (!userId) {
      throw new Error("Missing user ID in webhook data");
    }

    // Check if user exists by ID or email
    const [existingUserById, existingUserByEmail] = await Promise.all([
      tx.query.user.findFirst({ where: eq(user.id, userId) }),
      email ? tx.query.user.findFirst({ where: eq(user.email, email) }) : null,
    ]);

    if (existingUserById) {
      logger("User already exists by ID:", userId);
      return;
    }

    if (existingUserByEmail) {
      logger("User with email already exists:", email);
      return;
    }

    const firstName = evt.data.first_name || "";
    const lastName = evt.data.last_name || "";
    const fullName = lastName
      ? `${firstName} ${lastName}`.trim()
      : firstName.trim();

    await tx.insert(user).values({
      id: userId,
      name: fullName,
      email: email,
      createdAt: new Date(evt.data.created_at),
      updatedAt: new Date(evt.data.updated_at),
    });

    logger("User created successfully:", userId);
  });
}

async function handleUserUpdated(evt: any) {
  return await db.transaction(async (tx) => {
    const userId = evt.data.id as string;
    const email = evt.data.email_addresses[0]?.email_address as string;

    if (!userId) {
      throw new Error("Missing user ID in webhook data");
    }

    const [existingUser, existingUserByEmail] = await Promise.all([
      tx.query.user.findFirst({ where: eq(user.id, userId) }),
      email ? tx.query.user.findFirst({ where: eq(user.email, email) }) : null,
    ]);

    const firstName = evt.data.first_name || "";
    const lastName = evt.data.last_name || "";
    const fullName = lastName
      ? `${firstName} ${lastName}`.trim()
      : firstName.trim();

    if (existingUser) {
      const shouldUpdateEmail =
        !existingUserByEmail || existingUserByEmail.id === userId;

      await tx
        .update(user)
        .set({
          name: fullName,
          ...(shouldUpdateEmail && email ? { email } : {}),
          updatedAt: new Date(evt.data.updated_at),
        })
        .where(eq(user.id, userId));

      logger("User updated successfully:", userId);
    } else if (existingUserByEmail) {
      logger("Cannot create user with duplicate email:", email);
    } else {
      // Create user if it doesn't exist
      await tx.insert(user).values({
        id: userId,
        name: fullName,
        email: email,
        createdAt: new Date(evt.data.created_at || Date.now()),
        updatedAt: new Date(evt.data.updated_at || Date.now()),
      });

      logger("User created during update event:", userId);
    }
  });
}

async function handleUserDeleted(evt: any) {
  return await db.transaction(async (tx) => {
    const userId = evt.data.id as string;

    if (!userId) {
      throw new Error("Missing user ID in webhook data");
    }

    const existingUser = await tx.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (existingUser) {
      await tx.delete(user).where(eq(user.id, userId));
      logger("User deleted successfully:", userId);
    } else {
      logger("User not found for deletion:", userId);
    }
  });
}
