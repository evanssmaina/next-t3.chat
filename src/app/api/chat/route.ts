import {
  createStreamId,
  getStreamIdsByChatId,
  loadPreviousMessages,
  saveChat,
} from "@/ai/chat-store";
import { registry } from "@/ai/providers";
import { logger, withAxiom } from "@/lib/axiom/server";
import { redis } from "@/lib/redis";
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
import { NextResponse } from "next/server";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";

export const POST = withAxiom(async (req) => {
  const {
    message,
    chatId,
    model,
  }: { message: Message; chatId: string; model: string } = await req.json();

  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized. Please login to continue.", {
      status: 401,
    });
  }

  console.log(message, chatId, model);
  if (!message || !chatId || !model) {
    return new NextResponse("Message and chat ID and model are required", {
      status: 400,
    });
  }

  const [previousMessages] = await Promise.all([
    loadPreviousMessages({
      chatId,
      userId,
    }),
    createStreamId({
      chatId,
      userId,
    }),
  ]);

  const messages = appendClientMessage({
    messages: !previousMessages ? [] : previousMessages,
    message,
  });

  return createDataStreamResponse({
    execute: (dataStream) => {
      dataStream.writeMessageAnnotation({ aiModel: model });

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
          },
        },
        async onFinish({ response }) {
          try {
            const messagesToSave = appendResponseMessages({
              messages: messages,
              responseMessages: response.messages,
            });

            await saveChat({
              chatId: chatId,
              userId: userId,
              messages: messagesToSave,
            });
          } catch (error) {
            logger.error("Error saving chat messages to the db:", error as any);
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
      console.error(error);
      return "Oops, an error occurred!";
    },
  });
});

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
