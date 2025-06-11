import { Chat } from "@/components/chat/chat";
import { Suspense } from "react";

export default async function Page() {
  return (
    <>
      <Suspense>
        <Chat />
      </Suspense>
    </>
  );
}
