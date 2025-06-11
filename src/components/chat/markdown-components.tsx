import { Icons } from "@/components/icons";
import {
  CodeBlock,
  CodeBlockCode,
  CodeBlockGroup,
} from "@/components/ui/code-block";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import type { Components } from "react-markdown";
import { toast } from "sonner";
import { Button } from "../ui/button";

function extractLanguage(className?: string): string {
  if (!className) return "plaintext";
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : "plaintext";
}

export const markdownComponents: Partial<Components> = {
  a: ({ children, href }) => <Link href={href as string}>{children}</Link>,

  blockquote: ({ children }) => (
    <blockquote className="mt-6 border-l-4 border-muted pl-6 italic">
      {children}
    </blockquote>
  ),

  code: ({ className, children, ...props }) => {
    const [copied, setCopied] = useState(false);

    const isInline =
      !props.node?.position?.start.line ||
      props.node?.position?.start.line === props.node?.position?.end.line;

    const handleCopy = () => {
      navigator.clipboard.writeText(children as string);
      setCopied(true);
      toast.success("Code copied succesfully");
      setTimeout(() => setCopied(false), 2000);
    };

    if (isInline) {
      return (
        <span
          className={cn(
            "bg-muted/50 rounded-sm px-1 font-mono text-sm",
            className,
          )}
          {...props}
        >
          {children}
        </span>
      );
    }

    const language = extractLanguage(className);

    return (
      <CodeBlock className="font-mono">
        <CodeBlockGroup className="border-border border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="bg-muted/50 text-white rounded px-2 py-1 text-xs font-medium">
              {language}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopy}
          >
            {copied ? (
              <Icons.check className="h-4 w-4 text-green-500" />
            ) : (
              <Icons.copy className="h-4 w-4" />
            )}
          </Button>
        </CodeBlockGroup>
        <CodeBlockCode
          theme="github-dark-dimmed"
          code={children as string}
          language={language}
        />
      </CodeBlock>
    );
  },
};
