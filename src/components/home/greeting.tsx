"use client";

import { useAuth, useUser } from "@clerk/nextjs";

export function Greeting() {
  const { userId } = useAuth();
  const { user } = useUser();

  return (
    <h1 className="text-3xl font-semibold">
      {userId ? `How can I help you, ${user}?` : "How can I help you?"}
    </h1>
  );
}
