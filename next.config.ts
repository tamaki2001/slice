import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "books.google.com" },
      { hostname: "*.googleusercontent.com" },
      { hostname: "cover.openbd.jp" },
      { hostname: "*.openbd.jp" },
    ],
  },
};

export default nextConfig;
