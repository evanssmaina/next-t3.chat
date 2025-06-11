import type { Message } from "ai";
import { Loader } from "../ui/loader";
import { Message as MessageComponent } from "../ui/message";

interface AILoadingProps {
  status: "submitted" | "error" | "ready" | "streaming";
  messages: Message[];
}

export function AILoading({ status, messages }: AILoadingProps) {
  return (
    <>
      {status === "submitted" &&
        messages.length > 0 &&
        messages[messages.length - 1]?.role === "user" && (
          <MessageComponent className="text-foreground just prose flex-1 rounded-lg bg-transparent p-0">
            <Loader variant="typing" size="lg" />
          </MessageComponent>
        )}
    </>
  );
}
