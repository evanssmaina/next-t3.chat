"use client";

import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon, Loader2Icon, SquareIcon } from "lucide-react";

interface ChatInputProps {
  status: "submitted" | "streaming" | "ready" | "error";
  stop: () => void;
  input: string;
  handleValueChange: (value: string) => void;
  handleSend: (
    e?:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function ChatInput({
  input,
  handleValueChange,
  handleKeyDown,
  status,
  handleSend,
  stop,
}: ChatInputProps) {
  const isDisabled =
    !input.trim() || status === "submitted" || status === "error";
  const isInteractive = status === "ready" || status === "error"; // Allow typing during error

  return (
    <PromptInput
      value={input}
      onValueChange={handleValueChange}
      isLoading={status === "streaming"}
      onSubmit={handleSend}
      className="w-full max-w-(--breakpoint-md)"
    >
      <PromptInputTextarea
        onKeyDown={handleKeyDown}
        disabled={!isInteractive}
        placeholder="Ask me anything..."
      />

      <PromptInputActions className="flex items-center justify-end gap-2 pt-2">
        <PromptInputAction
          tooltip={
            status === "submitted"
              ? "Submitting..."
              : status === "streaming"
                ? "Stop generating"
                : status === "error"
                  ? "Fix errors and try again"
                  : "Send message"
          }
        >
          <Button
            variant={status === "error" ? "destructive" : "default"}
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              if (status === "streaming") {
                stop();
                return;
              }

              if ((status === "ready" || status === "error") && input.trim()) {
                handleSend();
              }
            }}
            disabled={isDisabled}
          >
            {status === "submitted" ? (
              <Loader2Icon className="animate-spin" />
            ) : status === "streaming" ? (
              <SquareIcon className="size-5 fill-current" />
            ) : (
              <ArrowUpIcon className="size-5" />
            )}
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  );
}
