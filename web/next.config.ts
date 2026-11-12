import type { NextConfig } from "next";

const backendUrl = process.env.RETURNGUARD_API_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  transpilePackages: ["@returnguard/react", "@returnguard/sdk"],
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: `${backendUrl}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
