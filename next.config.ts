import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "**.dicebear.com" },
      { protocol: "https", hostname: "cdn.dicebear.com" },
      { protocol: "https", hostname: "**.*.dicebear.com" },
      { protocol: "http", hostname: "127.0.0.1", port: "8188" },
    ],
    dangerouslyAllowSVG: true,
    minimumCacheTTL: 60,
    loader: "default",
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
