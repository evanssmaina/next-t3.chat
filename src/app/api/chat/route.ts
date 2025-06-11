import { loadChatMessages, saveChat } from "@/ai/chat-store";
import { google } from "@ai-sdk/google";
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
import { NextResponse } from "next/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { message, chatId }: { message: Message; chatId: string } =
    await req.json();

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized. Please login to continue.",
      },
      {
        status: 401,
      },
    );
  }

  if (!message || !chatId) {
    return NextResponse.json(
      { error: "Message and chat ID are required" },
      { status: 400 },
    );
  }

  const previousMessages = await loadChatMessages(chatId, userId);

  const messages = appendClientMessage({
    messages: !previousMessages ? [] : previousMessages,
    message,
  });

  return createDataStreamResponse({
    execute: (dataStream) => {
      const aiModel = "gemini-2.5-flash";
      const result = streamText({
        model: google("gemini-2.5-flash-preview-04-17", {
          useSearchGrounding: true,
        }),
        messages,
        experimental_transform: smoothStream({
          delayInMs: 20,
          chunking: "word",
        }),
        experimental_generateMessageId: createIdGenerator({
          prefix: "msgs",
          separator: "_",
        }),
        async onFinish({ response }) {
          try {
            const messagesToSave = appendResponseMessages({
              messages: messages,
              responseMessages: response.messages,
            });

            console.log(
              JSON.stringify(messagesToSave, null, 2),
              "messagesToSave",
            );

            await saveChat({
              chatId: chatId,
              userId: userId,
              messages: messagesToSave,
              aiModel,
            });
          } catch (error) {
            console.error("Error saving chat messages:", error);
            // Don't throw here - we want to complete the stream even if saving fails
          }
        },
      });

      dataStream.writeData({ aiModel: aiModel });

      result.consumeStream();

      result.mergeIntoDataStream(dataStream, {
        sendSources: true,
      });
    },
    onError: (error) => {
      console.log(error);
      return "Oops, an error occurred!";
    },
  });
}
