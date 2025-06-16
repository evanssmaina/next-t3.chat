import { auth } from "@clerk/nextjs/server";
import got from "got";
import createMetascraper from "metascraper";
import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperTitle from "metascraper-title";
import { NextResponse } from "next/server";
import { z } from "zod/v4";

const metascraper = createMetascraper([
  metascraperDescription(),
  metascraperImage(),
  metascraperTitle(),
]);

const urlSchema = z.url({
  protocol: /^https?$/,
  hostname: z.regexes.domain,
});

const batchUrlsSchema = z.object({
  urls: z
    .array(urlSchema)
    .min(1, "At least one URL required")
    .max(20, "Maximum 20 URLs allowed"),
});

async function fetchMetadata(url: string) {
  try {
    const { body: html, url: finalUrl } = await got(url, {
      followRedirect: true,
      maxRedirects: 5,
      timeout: { request: 8000 }, // 8 seconds
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MetadataBot/1.0)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      retry: { limit: 1 }, // Single retry only
    });

    const metadata = await metascraper({ html, url: finalUrl });

    return {
      title: metadata.title || null,
      description: metadata.description || null,
      favicon: metadata.image || getFaviconUrl(finalUrl),
      finalUrl: finalUrl,
    };
  } catch (error) {
    console.error(`Failed to fetch metadata for ${url}:`, error);
    return {
      title: null,
      description: null,
      favicon: getFaviconUrl(url),
      finalUrl: url,
    };
  }
}

function getFaviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return "https://www.google.com/favicon.ico";
  }
}

// Batch endpoint for multiple URLs
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login to continue.",
        },
        {
          status: 401,
        },
      );
    }

    // Validate request body with Zod
    const validation = batchUrlsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
        },
        { status: 400 },
      );
    }

    const { urls } = validation.data;

    // Fetch metadata for all URLs in parallel
    const results = await Promise.allSettled(
      urls.map(async (url: string) => {
        const metadata = await fetchMetadata(url);
        return { url, metadata };
      }),
    );

    // Build response map
    const metadataMap = results.reduce(
      (acc, result) => {
        if (result.status === "fulfilled") {
          acc[result.value.url] = result.value.metadata;
        }
        return acc;
      },
      {} as Record<string, any>,
    );

    return NextResponse.json(metadataMap);
  } catch (error) {
    console.error("Batch metadata fetch error:", error);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 },
    );
  }
}
