"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/server/trpc/client";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useState } from "react";

// Define types inside the same file
interface Source {
  sourceType: string;
  id: string;
  url: string;
}

interface Metadata {
  url: string;
  title: string;
  description: string;
  favicon: string;
  finalUrl: string;
  error?: string;
}

interface AISourcesListProps {
  sources: Source[];
}

// Source detail component for the sheet view
const SourceDetail = ({
  source,
  index,
  metadata,
  isLoading,
}: {
  source: Source;
  index: number;
  metadata?: Metadata;
  isLoading: boolean;
}) => {
  return (
    <Link
      href={metadata?.finalUrl || source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start bg-muted/50 border border-muted rounded-md p-3 hover:bg-muted transition-colors w-full"
    >
      <div className="flex flex-col gap-3 w-full">
        <h1 className="text-base font-medium text-foreground">
          {index + 1}.{" "}
          {isLoading ? (
            <Skeleton className="h-6 w-64 inline-block" />
          ) : (
            metadata?.title || metadata?.finalUrl || source.url
          )}
        </h1>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          metadata?.description && (
            <p className="text-sm text-foreground line-clamp-3">
              {truncate(metadata.description, 150)}
            </p>
          )
        )}

        <div className="flex gap-2">
          <div className="size-4 flex-shrink-0 bg-white rounded overflow-hidden shadow-sm mt-0.5">
            {isLoading ? (
              <Skeleton className="w-6 h-6" />
            ) : (
              <Image
                src={metadata?.favicon || ""}
                alt={metadata?.title || ""}
                width={24}
                height={24}
                className="w-6 h-6"
              />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {isLoading ? (
              <Skeleton className="h-4 w-48" />
            ) : metadata?.finalUrl ? (
              new URL(metadata.finalUrl).hostname
            ) : null}
          </p>
        </div>
      </div>
    </Link>
  );
};

// Truncate helper function
const truncate = (text: string | undefined, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text || "";
  return `${text.substring(0, maxLength)}...`;
};

const FaviconItem = ({
  source,
  index,
  metadata,
}: {
  source: Source;
  index: number;
  metadata?: Metadata;
}) => {
  return (
    <div
      key={source.id}
      className="w-6 h-6 rounded-sm bg-white shadow-sm border border-border overflow-hidden"
      style={{
        position: "relative",
        marginLeft: index === 0 ? "0" : "-8px",
        zIndex: 4 - index,
      }}
    >
      {metadata?.favicon && (
        <Image
          src={metadata.favicon}
          alt={metadata?.title || ""}
          width={24}
          height={24}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

export const AISourcesList: React.FC<AISourcesListProps> = ({ sources }) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Extract URLs from sources
  const urls = sources.map((source) => source.url);

  // Fetch metadata for all URLs using tRPC

  const trpc = useTRPC();
  const {
    data: metadataResults,
    isLoading,
    error,
  } = useQuery(
    trpc.metadata.fetch.queryOptions({
      urls: urls,
    }),
  );

  // Create a map for easy lookup of metadata by URL
  const metadataMap = new Map<string, Metadata>();
  if (metadataResults) {
    metadataResults.forEach((result) => {
      metadataMap.set(result.url, result);
    });
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div
        className="flex items-center cursor-pointer bg-muted/50 border border-muted rounded-full w-fit px-3 py-2 hover:bg-muted duration-100 ease-in-out transition-colors"
        onClick={() => setIsSheetOpen(true)}
      >
        <div className="flex items-center relative">
          {sources.slice(0, 4).map((source, index) => (
            <FaviconItem
              key={source.id}
              source={source}
              index={index}
              metadata={metadataMap.get(source.url)}
            />
          ))}
        </div>
        <span className="ml-2 text-sm text-muted-foreground">
          {sources.length} web pages
        </span>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="flex w-[600px] max-w-full flex-col p-0 sm:max-w-[600px] md:max-w-[600px] lg:max-w-[600px]"
        >
          <SheetHeader className="sticky inset-x-0 top-0 bg-background">
            <SheetTitle className="text-xl">
              Sources ({sources.length})
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-2 overflow-y-auto py-5">
            {sources.map((source, index) => (
              <SourceDetail
                key={`source-detail-${source.id}`}
                source={source}
                index={index}
                metadata={metadataMap.get(source.url)}
                isLoading={isLoading}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
