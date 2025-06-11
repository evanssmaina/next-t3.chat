import { Icons } from "@/components/icons";
import type { ChatRequestOptions, UIMessage } from "ai";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { MessageAction, MessageActions } from "../ui/message";
import { AISourcesList } from "./ai-sources";

interface MessageFooterProps {
  message: UIMessage;
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  isStreaming?: boolean;
  status: "submitted" | "error" | "ready" | "streaming";
}

export const AIMessageFooter = ({
  message,
  reload,
  isStreaming = false,
  status,
}: MessageFooterProps) => {
  const [copied, setCopied] = useState(false);

  // Don't render if currently streaming
  if (isStreaming || status === "error") {
    return null;
  }

  const handleCopyText = () => {
    const textParts = message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n");

    navigator.clipboard.writeText(textParts);
    setCopied(true);
    toast.success("Text copied successfully");
    setTimeout(() => setCopied(false), 2000);
  };

  const sources = message.parts.filter((part) => part.type === "source");

  return (
    <motion.div
      className="flex items-center justify-between w-full gap-3 mt-2"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <MessageActions className="flex-shrink-0">
        <MessageAction tooltip="Copy to clipboard">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopyText}
          >
            {copied ? (
              <Icons.check className="h-4 w-4 text-green-500" />
            ) : (
              <Icons.copy className="h-4 w-4" />
            )}
          </Button>
        </MessageAction>
        <MessageAction tooltip="Retry Message">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => reload()}
          >
            <Icons.refresh className="size-4" />
          </Button>
        </MessageAction>
      </MessageActions>

      <p className="text-muted-foreground text-md flex-1">Gemini 2.5 Flash</p>

      {/* {sources.length > 0 && (
        <AISourcesList sources={sources.map((part) => part.source)} />
      )} */}
    </motion.div>
  );
};
