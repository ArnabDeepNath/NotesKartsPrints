import type { NextConfig } from "next";

// Derive the backend base URL (strip trailing /api) for proxying uploads
const BACKEND_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(
    /\/api\/?$/,
    "",
  );

const shouldProxyUploads = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  // No "standalone" output — we use a custom server (server.js)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  // Proxy /uploads/* to the backend so relative cover-image paths work in dev
  async rewrites() {
    if (!shouldProxyUploads) {
      return [];
    }

    return [
      {
        source: "/uploads/:path*",
        destination: `${BACKEND_BASE}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
