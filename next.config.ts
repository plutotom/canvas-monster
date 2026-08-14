import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nested raycast/pnpm-lock.yaml confuses Next's workspace-root inference.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
