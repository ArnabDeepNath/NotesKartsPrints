import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No "standalone" output — we use a custom server (server.js)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
