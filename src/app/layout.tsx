import { geist, geistMono } from "@/styles/fonts/fonts";
import type { Metadata } from "next";
import "@/styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { env } from "@/env";
import { cn } from "@/lib/utils";
import { PostHogProvider } from "@/providers/posthog-provider";
import { TRPCReactProvider } from "@/trpc/client";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export const metadata: Metadata = {
  title: {
    template: `%s - ${siteConfig.title}`,
    default: siteConfig.name,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  authors: [{ name: "Evans Maina", url: siteConfig.url }],
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: `${siteConfig.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
    siteName: siteConfig.title,
    url: siteConfig.url,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: `${siteConfig.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
    site: "@evanssmaina",
  },
  keywords: ["open-source", "ai", "chatbot", "T3 Chat", "ai app"],
  alternates: {
    canonical: siteConfig.url,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
      publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      signInFallbackRedirectUrl={
        env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
      }
    >
      <TRPCReactProvider>
        <PostHogProvider>
          <html lang="en">
            <body
              className={cn(
                geist.variable,
                geistMono.variable,
                "antialiased bg-background text-foreground dark font-sans",
              )}
            >
              <NuqsAdapter>{children}</NuqsAdapter>
              <Toaster />
            </body>
          </html>
        </PostHogProvider>
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
