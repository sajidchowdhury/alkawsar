import type { NextConfig } from "next";

/**
 * Optional sub-path deployment.
 *
 * Set NEXT_PUBLIC_BASE_PATH=/alkawsar (in .env or shell) before `next build`
 * to serve the site under https://your-domain.com/alkawsar.
 * Leave it unset (empty) to serve from the domain root.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "standalone",
  ...(BASE_PATH ? { basePath: BASE_PATH } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
