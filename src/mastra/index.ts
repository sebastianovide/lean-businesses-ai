
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from "@mastra/loggers";
import { storage } from "./storage";
import { leanCanvasOrchestratorAgent } from "./agents/lean-canvas-orchestrator-agent";
import { firstCustomerAgent } from "./agents/first-customer-agent";
import { problemDiscoveryAgent } from "./agents/problem-discovery-agent";

const globalForMastra = globalThis as unknown as {
  mastra: Mastra | undefined;
};

export const mastra =
  globalForMastra.mastra ??
  new Mastra({
    workflows: {},
    agents: {
      leanCanvasOrchestratorAgent,
      firstCustomerAgent,
      problemDiscoveryAgent,
    },
    storage,
    logger: new PinoLogger({
      name: "Mastra",
      level: "info",
    }),
    telemetry: {
      // Telemetry is deprecated and will be removed in the Nov 4th release
      enabled: false,
    },
    observability: {
      // Enables DefaultExporter and CloudExporter for AI tracing
      default: {
        enabled: false,
        // enabled: true // it needs MASTRA_CLOUD_ACCESS_TOKEN in .env
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForMastra.mastra = mastra;
}