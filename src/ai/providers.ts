import { google } from "@ai-sdk/google";
import { xai } from "@ai-sdk/xai";
import { createProviderRegistry, customProvider } from "ai";

export const registry = createProviderRegistry(
  {
    xai: customProvider({
      languageModels: {
        "grok-3-mini": xai("grok-3-mini"),
      },
    }),
    google: customProvider({
      languageModels: {
        "gemini-2.0-flash": google("gemini-2.0-flash"),
        "gemini-2.0-flash-lite": google("gemini-2.0-flash-lite"),
        "gemini-2.5-flash": google("gemini-2.5-flash-preview-04-17", {
          useSearchGrounding: true,
        }),
        "gemini-2.5-flash-thinking": google(
          "gemini-2.0-flash-thinking-exp-01-21",
        ),
      },
    }),
  },
  {
    separator: ":",
  },
);

export const availableModels = [
  {
    id: "google:gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    description: "Balanced price & performance",
  },
  {
    id: "google:gemini-2.5-flash-thinking",
    name: "Gemini 2.5 Flash Thinking",
    provider: "Google",
    description: "Shows reasoning steps",
  },
  {
    id: "google:gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    description: "Multimodal with tool use",
  },
  {
    id: "google:gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    provider: "Google",
    description: "Optimized for speed",
  },
];
