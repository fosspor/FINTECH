import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://backend:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/voice/:path*",
        destination: `${backendUrl}/api/voice/:path*`,
      },
      {
        source: "/ai/:path*",
        destination: `${backendUrl}/ai/:path*`,
      },
      {
        source: "/auth/:path*",
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        source: "/profile",
        destination: `${backendUrl}/profile`,
      },
      {
        source: "/consultations",
        destination: `${backendUrl}/consultations`,
      },
    ];
  },
};

export default nextConfig;
