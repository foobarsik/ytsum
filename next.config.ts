import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: false,
  turbopack: { root: process.cwd() },
  allowedDevOrigins: ["127.0.0.1"],
  images: { remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }, { protocol: "https", hostname: "img.youtube.com" }, { protocol: "https", hostname: "yt3.ggpht.com" }] },
};

export default nextConfig;
