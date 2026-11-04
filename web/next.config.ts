import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@returnguard/react", "@returnguard/sdk"],
};

export default nextConfig;
