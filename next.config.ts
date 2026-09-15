import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["mascot-taqui"],
  outputFileTracingRoot: path.join(import.meta.dirname, ".."),
  turbopack: {
    root: path.join(import.meta.dirname, ".."),
  },
};

export default nextConfig;
