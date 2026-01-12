import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* React Compiler for performance optimization */
  reactCompiler: true,

  /* Static export for Cloudflare Pages */
  output: 'export',

  /* Image optimization for Cloudflare Pages */
  images: {
    unoptimized: true, // Required for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },

  /* Environment variables */
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
