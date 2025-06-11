import { TRPCReactProvider } from "@/server/trpc/client";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TRPCReactProvider>
      <NuqsAdapter>{children}</NuqsAdapter>
    </TRPCReactProvider>
  );
}
