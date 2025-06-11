import { google } from "@ai-sdk/google";
import { xai } from "@ai-sdk/xai";
import { customProvider } from "ai";

export const mpesaFlowAIModel = customProvider({
  languageModels: {
    chat: google("gemini-2.5-flash-preview-04-17"),
    objectGeneration: xai("grok-3"),
  },
});
