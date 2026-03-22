import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow self-hosted development on network IPs
  experimental: {
    optimizePackageImports: ["@/lib"],
  },
};

export default nextConfig;
