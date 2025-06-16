import { URL } from "url";
import { protectedProcedure, router } from "@/trpc/init";
import got from "got";
import createMetascraper from "metascraper";
import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperLogo from "metascraper-logo";
import metascraperTitle from "metascraper-title";
import metascraperUrl from "metascraper-url";
import { z } from "zod/v4";

const metascraper = createMetascraper([
  metascraperTitle(),
  metascraperDescription(),
  metascraperImage(),
  metascraperUrl(),
  metascraperLogo(),
]);

// Enhanced security configurations
const BLOCKED_DOMAINS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
]);

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

const REQUEST_CONFIG = {
  followRedirect: true,
  maxRedirects: 5,
  timeout: {
    request: 15000,
    connect: 5000,
  },
  cache: false,
  retry: {
    limit: 3,
    methods: ["GET"],
    statusCodes: [408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
  },
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; MetadataBot/1.0; +https://your-domain.com/bot)",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    DNT: "1",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  },
  decompress: true,
  responseType: "text" as const,
  maxSize: 10 * 1024 * 1024, // 10MB limit
};

interface MetadataResult {
  url: string;
  title: string;
  description: string;
  favicon: string;
  image?: string;
  finalUrl: string;
  error?: string;
  status: "success" | "error";
}

function validateUrl(urlString: string): { isValid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(urlString);

    // Check protocol
    if (!ALLOWED_PROTOCOLS.has(parsedUrl.protocol)) {
      return { isValid: false, error: "Unsupported protocol" };
    }

    // Check for blocked domains
    const hostname = parsedUrl.hostname.toLowerCase();
    if (BLOCKED_DOMAINS.has(hostname)) {
      return { isValid: false, error: "Blocked domain" };
    }

    // Check for private IP ranges (basic check)
    if (
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)
    ) {
      return { isValid: false, error: "Private IP address" };
    }

    // Block URLs with credentials
    if (parsedUrl.username || parsedUrl.password) {
      return { isValid: false, error: "URLs with credentials not allowed" };
    }

    // Basic length validation
    if (urlString.length > 2048) {
      return { isValid: false, error: "URL too long" };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Invalid URL format",
    };
  }
}

function sanitizeUrl(urlString: string): string {
  try {
    const url = new URL(urlString);

    // Remove credentials and fragments
    url.username = "";
    url.password = "";
    url.hash = "";

    // Normalize the URL
    return url.toString();
  } catch {
    return urlString;
  }
}

function getFaviconUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    // Try multiple favicon services as fallbacks
    return `https://www.google.com/s2/favicons?domain=${domain}`;
  } catch {
    return "/favicon.ico";
  }
}

function cleanText(text: string | undefined | null): string {
  if (!text) return "";

  return text
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/[\r\n\t]/g, " ") // Remove line breaks and tabs
    .trim()
    .substring(0, 500); // Limit length
}

async function fetchMetadata(urlString: string): Promise<MetadataResult> {
  if (!validation.isValid) {
    return {
      url: urlString,
      title: "Invalid URL",
      description: "URL failed validation",
      favicon: getFaviconUrl(urlString),
      finalUrl: urlString,
      error: validation.error,
      status: "error",
    };
  }

  try {
    const sanitizedUrl = sanitizeUrl(urlString);
    const { html, finalUrl } = await fetchWithRetry(sanitizedUrl);

    // Check if we got actual HTML content
    if (!html || html.length < 100) {
      throw new Error("Received empty or minimal content");
    }

    const metadata = await metascraper({
      html,
      url: finalUrl,
    });

    // Extract and clean metadata
    const title = cleanText(metadata.title) || getDefaultTitle(finalUrl);
    const description =
      cleanText(metadata.description) || "No description available";
    const image = metadata.image || metadata.logo;
    const favicon = getFaviconUrl(finalUrl);

    return {
      url: urlString,
      title,
      description,
      favicon,
      image: image && isValidImageUrl(image) ? image : undefined,
      finalUrl,
      status: "success",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Provide more specific error handling
    let userFriendlyError = "Failed to fetch metadata";
    if (
      errorMessage.includes("ENOTFOUND") ||
      errorMessage.includes("getaddrinfo")
    ) {
      userFriendlyError = "Website not found";
    } else if (errorMessage.includes("timeout")) {
      userFriendlyError = "Request timed out";
    } else if (errorMessage.includes("403") || errorMessage.includes("401")) {
      userFriendlyError = "Access denied";
    } else if (errorMessage.includes("404")) {
      userFriendlyError = "Page not found";
    } else if (errorMessage.includes("500")) {
      userFriendlyError = "Server error";
    }

    return {
      url: urlString,
      title: "Failed to fetch",
      description: userFriendlyError,
      favicon: getFaviconUrl(urlString),
      finalUrl: urlString,
      error: errorMessage,
      status: "error",
    };
  }
}

function getDefaultTitle(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace(/^www\./, "");
  } catch {
    return "Unknown website";
  }
}

export const metadataRouter = router({
  fetch: protectedProcedure
    .input(
      z.object({
        urls: z
          .array(z.url({ protocol: /^https$/ }))
          .min(1)
          .max(10),
      }),
    )
    .query(async ({ input }) => {
      const { urls } = input;

      // Process URLs with controlled concurrency to avoid overwhelming servers
      const BATCH_SIZE = 5;
      const results: MetadataResult[] = [];

      for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        const batch = urls.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
          batch.map((url) => fetchMetadata(url)),
        );

        const processedResults = batchResults.map((result, index) => {
          const originalUrl = batch[index]!;

          if (result.status === "fulfilled") {
            return result.value;
          } else {
            return {
              url: originalUrl,
              title: "Processing failed",
              description: "Failed to process URL",
              favicon: getFaviconUrl(originalUrl),
              finalUrl: originalUrl,
              error: "Promise rejected",
              status: "error" as const,
            };
          }
        });

        results.push(...processedResults);

        // Add small delay between batches to be respectful
        if (i + BATCH_SIZE < urls.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      return results;
    }),
});

export type MetadataRouter = typeof metadataRouter;
