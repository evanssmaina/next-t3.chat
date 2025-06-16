import { Icons } from "@/components/icons";

export function LoadingFallback() {
  return (
    <div className="flex h-screen flex-col overflow-hidden justify-center">
      <div className="flex items-center justify-center flex-1 gap-2">
        <Icons.loader className="animate-spin size-5" />
      </div>
    </div>
  );
}
