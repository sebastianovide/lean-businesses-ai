import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [
    "@mastra/loggers",
    "@mastra/core",
    "pino",
    "thread-stream",
    "pino-pretty",
    "pino-abstract-transport",
    "sonic-boom",
    "atomic-sleep",
  ],
};

export default nextConfig;
