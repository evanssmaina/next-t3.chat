"use client";

import { useTRPC } from "@/server/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { MessagesSquareIcon } from "lucide-react";
import Link from "next/link";

export function ChatCards() {
  const trpc = useTRPC();

  const { data: chats } = useQuery(
    trpc.chat.get.queryOptions({
      limit: 6,
    }),
  );

  return (
    <div className="p-5 space-y-5">
      <h1 className="text-xl font-medium">Recents</h1>
      <div className="grid grid-cols-3 grid-rows-2 w-full gap-3">
        {chats?.map((chat) => {
          const relativeTime = formatDistanceToNow(chat.updatedAt, {
            addSuffix: true,
          });
          return (
            <Link
              key={chat.id}
              href={`/?chat=${chat.id}`}
              className="flex flex-col w-full gap-3 p-3 border borde-muted hover:bg-muted ease-in-out duration-150 cursor-pointer rounded-xl"
            >
              <MessagesSquareIcon className="size-5" />
              <h3 className="text-lg">{chat.title}</h3>
              <p className="text-muted-foreground text-sm">{relativeTime}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
