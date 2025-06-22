import {
  getStreamIdsByChatId,
  loadPreviousMessages,
  saveChat,
} from "@/ai/chat-store";
import { registry } from "@/ai/providers";
import { logger } from "@/lib/logger";
import { redis } from "@/lib/redis";
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import {
  type Message,
  appendClientMessage,
  appendResponseMessages,
  createDataStreamResponse,
  createIdGenerator,
  smoothStream,
  streamText,
} from "ai";
import { createDataStream } from "ai";
import { differenceInSeconds } from "date-fns";
import { type NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";

const log = logger.child({ module: "api/chat" });

export async function POST(req: NextRequest) {
  log.info("Starting chat");
  const {
    message,
    chatId,
    model,
  }: { message: Message; chatId: string; model: string } = await req.json();

  const { userId } = await auth();

  if (!userId) {
    log.warn("Unauthorized. Please login to continue.");
    return new NextResponse("Unauthorized. Please login to continue.", {
      status: 401,
    });
  }

  log.info("Received message:", message);
  log.info("Received chatId:", chatId);
  log.info("Received model:", model);

  if (!message || !chatId || !model) {
    log.warn("Missing message, chatId, or model");
    return new NextResponse("Message and chat ID and model are required", {
      status: 400,
    });
  }

  log.info("Fetching previous messages for chatId:", chatId);
  const previousMessages = await loadPreviousMessages({
    chatId,
    userId,
  });

  log.info("Previous messages fetched for chatId:", chatId);

  log.info("Appending client message");
  const messages = appendClientMessage({
    messages: !previousMessages ? [] : previousMessages,
    message,
  });

  log.info("Client message appended");

  log.info("Creating data stream response");
  return createDataStreamResponse({
    execute: (dataStream) => {
      dataStream.writeMessageAnnotation({ model });

      const result = streamText({
        model: registry.languageModel(model as any),
        messages,
        experimental_transform: smoothStream({
          delayInMs: 20,
          chunking: "word",
        }),
        experimental_generateMessageId: createIdGenerator({
          prefix: "msgs",
          separator: "_",
        }),
        providerOptions: {
          google: {
            thinkingConfig: {
              includeThoughts: true,
              thinkingBudget: 10000,
            },
          } satisfies GoogleGenerativeAIProviderOptions,
        },
        async onFinish({ response }) {
          dataStream.writeMessageAnnotation({ model });
          log.info("Saving chat messages to the db");
          try {
            log.info("appending chat messages for saving to db");
            const messagesToSave = appendResponseMessages({
              messages: messages,
              responseMessages: response.messages,
            });
            log.info("appended chat messages for saving to db");

            log.info("Saving chat messages to the db");
            await saveChat({
              chatId: chatId,
              userId: userId,
              messages: messagesToSave,
            });
            log.info("Saved chat messages to the db");
          } catch (error) {
            log.error("Error saving chat messages to the db:", error as any);
            // Don't throw here - we want to complete the stream even if saving fails
          }
        },
      });

      result.consumeStream();

      result.mergeIntoDataStream(dataStream, {
        sendSources: true,
        sendUsage: false,
        sendReasoning: true,
      });
    },
    onError: (error) => {
      log.error("Error in createDataStreamResponse:", error);
      return "Oops, an error occurred!";
    },
  });
}

const streamContext = createResumableStreamContext({
  waitUntil: after,
  publisher: redis,
  subscriber: redis,
  keyPrefix: "chat-stream",
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");
  const { userId } = await auth();
  const resumeRequestedAt = new Date();

  if (!userId) {
    return new NextResponse("Unauthorized. Please login to continue.", {
      status: 401,
    });
  }

  if (!chatId) {
    return new NextResponse("id is required", { status: 400 });
  }

  const streamIds = await getStreamIdsByChatId({
    chatId,
    userId,
  });

  if (!streamIds.length) {
    return new NextResponse("No streams found", { status: 404 });
  }

  const recentStreamId = streamIds.at(-1);

  if (!recentStreamId) {
    return new NextResponse("No recent stream found", { status: 404 });
  }

  const emptyDataStream = createDataStream({
    execute: () => {},
  });

  const stream = await streamContext.resumableStream(
    recentStreamId,
    () => emptyDataStream,
  );

  if (stream) {
    return new NextResponse(stream, { status: 200 });
  }

  /*
   * For when the generation is "active" during SSR but the
   * resumable stream has concluded after reaching this point.
   */

  const messages = await loadPreviousMessages({
    chatId,
    userId,
  });
  const mostRecentMessage = messages?.at(-1);

  if (!mostRecentMessage || mostRecentMessage.role !== "assistant") {
    return new Response(emptyDataStream, { status: 200 });
  }

  const messageCreatedAt = new Date(mostRecentMessage.createdAt as Date);

  if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
    return new NextResponse(emptyDataStream, { status: 200 });
  }

  const streamWithMessage = createDataStream({
    execute: (buffer) => {
      buffer.writeData({
        type: "append-message",
        message: JSON.stringify(mostRecentMessage),
      });
    },
  });

  return new NextResponse(streamWithMessage, { status: 200 });
}
