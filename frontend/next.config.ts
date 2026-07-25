import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const GATEWAY_URL = process.env.GATEWAY_URL ?? "http://localhost:5000";
const frontendDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: frontendDir,
  async rewrites() {
    return [
      {
        source: "/api/gateway/:path*",
        destination: `${GATEWAY_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
