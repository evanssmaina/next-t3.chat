import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col ">
      <div className="fixed p-4">
        <Button asChild variant={"ghost"} size={"lg"} className="gap-4 w-fit ">
          <Link href="/">
            <ArrowLeftIcon />
            Back to Chat
          </Link>
        </Button>
      </div>

      <div className="min-h-screen w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
