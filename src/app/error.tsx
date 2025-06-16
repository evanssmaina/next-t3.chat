"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="w-full max-w-3xl mx-auto mt-20 h-full flex">
      <div className="flex flex-col gap-3 w-full justify-center text-center">
        <p className="text-9xl font-mono">500</p>
        <h2>Something went wrong!</h2>
        <Button onClick={() => reset()} className="w-fit mx-auto mt-5">
          Try again
        </Button>
      </div>
    </div>
  );
}
