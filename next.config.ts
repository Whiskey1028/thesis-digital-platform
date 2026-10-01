import type { NextConfig } from "next";

/** Co-deploy default: Nginx `/thesis/` → this app. Local: http://localhost:3000/thesis */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/thesis";

const nextConfig: NextConfig = {
  basePath,
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath
  }
};

export default nextConfig;
