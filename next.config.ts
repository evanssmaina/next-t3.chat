import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: [
    "got",
    "metascraper",
    "metascraper-description",
    "metascraper-image",
    "metascraper-title",
    "metascraper-url",
    "metascraper-logo",
    "jsdom",
    "keyv",
  ],
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/phg/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/phg/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/phg/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        hostname: "assets.next-t3.chat",
      },
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
