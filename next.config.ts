import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    webpackBuildWorker: false,
    webpackMemoryOptimizations: true,
  },
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**', '**/ml-engine/**'],
    };
    return config;
  },
};

export default nextConfig;
