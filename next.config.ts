import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Note: Hydration warnings from browser extensions (fdprocessedid) are harmless
  // They occur when password managers/autofill modify the DOM before React hydrates
};

export default nextConfig;
