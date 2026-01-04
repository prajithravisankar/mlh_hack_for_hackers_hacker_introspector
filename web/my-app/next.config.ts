import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Tell Next.js to proxy API requests to your Vultr server
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        // ⚠️ REPLACE THIS IP WITH YOUR VULTR IP (Keep the http:// and :8080)
        destination: "http://155.138.201.202/api/:path*",
      },
    ];
  },
  // 2. Disable strict React mode if it causes double-renders (Optional but good for hackathons)
  reactStrictMode: false,
};

export default nextConfig;
