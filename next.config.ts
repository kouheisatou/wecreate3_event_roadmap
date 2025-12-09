import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repo = "wecreate3_event_roadmap";
const basePath = isProd ? `/${repo}` : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
