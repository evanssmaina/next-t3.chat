"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useState } from "react";

// Define types
interface Source {
  sourceType: string;
  id: string;
  url: string;
}

interface Metadata {
  title?: string;
  description?: string;
  favicon?: string;
  finalUrl?: string;
}

interface BatchMetadataResponse {
  [url: string]: Metadata;
}

interface AISourcesListProps {
  sources: Source[];
}

// Batch fetcher function
const fetchBatchMetadata = async (
  urls: string[],
): Promise<BatchMetadataResponse> => {
  const res = await fetch("/api/metadata/batch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ urls }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch batch metadata");
  }

  return res.json();
};

// Custom hook for batch metadata fetching
function useBatchSourceMetadata(sources: Source[]) {
  const urls = sources.map((source) => source.url);

  const { data, error, isLoading } = useQuery({
    queryKey: ["batch-metadata", urls],
    queryFn: () => fetchBatchMetadata(urls),
    enabled: urls.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    metadataMap: data || {},
    isError: !!error,
    isLoading,
  };
}

// Source detail component
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
  if (isLoading) {
    return (
      <div className="flex items-start bg-secondary/50 border border-muted rounded-md p-3 w-full">
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center gap-2">
            <span className="text-base font-medium">{index + 1}.</span>
            <Skeleton className="h-6 w-64" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex gap-2 items-center">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={metadata?.finalUrl || source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start bg-secondary/50 border border-muted rounded-md p-3 hover:bg-muted transition-colors w-full"
    >
      <div className="flex flex-col gap-3 w-full">
        <h1 className="text-base font-medium text-foreground truncate">
          {index + 1}. {metadata?.title || metadata?.finalUrl || source.url}
        </h1>

        {metadata?.description && (
          <p className="text-sm text-foreground truncate">
            {truncate(metadata.description, 150)}
          </p>
        )}

        <div className="flex gap-2 items-center">
          <div className="size-4 flex-shrink-0 bg-white rounded overflow-hidden shadow-sm">
            {metadata?.favicon && (
              <Image
                src={metadata.favicon}
                alt={metadata?.title || ""}
                width={16}
                height={16}
                className="w-4 h-4 object-cover"
              />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {metadata?.finalUrl
              ? new URL(metadata.finalUrl).hostname
              : new URL(source.url).hostname}
          </p>
        </div>
      </div>
    </Link>
  );
};

// Favicon item component
const FaviconItem = ({
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
    <div
      className="w-6 h-6 rounded-full bg-white shadow-sm border border-border overflow-hidden flex items-center justify-center"
      style={{
        position: "relative",
        marginLeft: index === 0 ? "0" : "-8px",
        zIndex: 4 - index,
      }}
    >
      {isLoading ? (
        <Skeleton className="w-6 h-6" />
      ) : metadata?.favicon ? (
        <Image
          src={metadata.favicon}
          alt={metadata?.title || ""}
          width={24}
          height={24}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <span className="text-xs text-gray-500">?</span>
        </div>
      )}
    </div>
  );
};

// Truncate helper function
const truncate = (text: string | undefined, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text || "";
  return `${text.substring(0, maxLength)}...`;
};

export const AISourcesList: React.FC<AISourcesListProps> = ({ sources }) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Fetch all metadata in a single batch request
  const { metadataMap, isLoading, isError } = useBatchSourceMetadata(sources);

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
              metadata={metadataMap[source.url]}
              isLoading={isLoading}
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
          <SheetHeader className="sticky inset-x-0 top-0 bg-background p-6">
            <SheetTitle className="text-xl">
              Sources ({sources.length})
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-3 pb-6 overflow-y-auto">
            {isError && (
              <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md">
                Failed to load source metadata.
              </div>
            )}
            {sources.map((source, index) => (
              <SourceDetail
                key={`source-detail-${source.id}`}
                source={source}
                index={index}
                metadata={metadataMap[source.url]}
                isLoading={isLoading}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
