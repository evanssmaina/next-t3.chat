import { Icons } from "../icons";
import { Button } from "../ui/button";
import { Message } from "../ui/message";

interface AIErrorMessageProps {
  reload: () => void;
}

export function AIErrorMessage({ reload }: AIErrorMessageProps) {
  return (
    <Message className="justify-start">
      <div className="h-fit bg-destructive/10  py-3 px-4 max-w-[80%] rounded-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span>Something went wrong</span>
          </div>
          <p className="text-sm">
            We couldn't process your request. Please try again.
          </p>
          <Button
            type="button"
            onClick={() => reload()}
            variant="outline"
            size="sm"
          >
            <Icons.refresh />
            Try Again
          </Button>
        </div>
      </div>
    </Message>
  );
}
