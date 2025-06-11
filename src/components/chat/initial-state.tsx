"use client";

import { useAuth, useUser } from "@clerk/nextjs";

export function InitialState() {
  const { userId } = useAuth();
  const { user } = useUser();

  return (
    <h1 className="text-3xl">
      {userId
        ? `How can I help you, ${user?.firstName}?`
        : "How can I help you?"}
    </h1>
  );
}
