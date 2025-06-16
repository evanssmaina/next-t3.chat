"use client";

import { cn } from "@/lib/utils";
import { RefreshCcwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "./ui/button";

export function ErrorFallback({ errorMessage = "Something went wrong" }) {
  const router = useRouter();
  const [isPending, startTransiton] = useTransition();

  const handleRefresh = () => {
    startTransiton(() => router.refresh());
  };

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border py-12">
      <div className="flex max-w-lg flex-col items-center justify-center gap-2 px-4">
        <h3 className="mt-2 font-medium text-destructive text-xl">
          Oops! Something Went Wrong
        </h3>
        <p className="mt-1 text-balance text-center text-muted-foreground text-sm">
          {errorMessage}
        </p>
      </div>
      <Button
        size={"sm"}
        variant={"outline"}
        onClick={handleRefresh}
        disabled={isPending}
      >
        <RefreshCcwIcon className={cn(isPending && "animate-spin")} />
        {isPending ? "Refreshing..." : "Try again"}
      </Button>
    </div>
  );
}
