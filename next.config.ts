import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: [
    "@react-pdf/renderer",
    "pdfjs-dist",
    "pino",
    "pino-pretty",
  ],
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/nt3/stc/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/nt3/ig/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/nt3/dcd",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
  images: {
    remotePatterns: [
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
