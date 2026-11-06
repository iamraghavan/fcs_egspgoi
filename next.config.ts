import type { NextConfig } from "next";

const DEPLOYED_API_URL = "https://faculty-credit-system.vercel.app/api/v1";
const isVercelProduction = process.env.VERCEL_ENV === "production";
const apiUrl = isVercelProduction ? DEPLOYED_API_URL : process.env.NEXT_PUBLIC_API_URL || DEPLOYED_API_URL;

const nextConfig: NextConfig = {
  // Keep browser requests and rewrites on the deployed API even if a local
  // NEXT_PUBLIC_API_URL was accidentally saved in Vercel's production settings.
  ...(isVercelProduction ? { env: { NEXT_PUBLIC_API_URL: DEPLOYED_API_URL } } : {}),
  // Dev-only badge: keep it away from the account avatar at the bottom of the navigation rail.
  devIndicators: { position: "bottom-right" },
  async redirects() {
    return [
      {
        source: "/bnys-1",
        destination: "/admissions/bnys/2025-2026",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
