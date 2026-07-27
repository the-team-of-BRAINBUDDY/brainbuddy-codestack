import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  turbopack: {
    root: __dirname,
  },
  // Silence warning about multiple lockfiles in production
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
