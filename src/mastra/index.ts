
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from "@mastra/loggers";
import { storage } from "./storage";
import { leanCanvasOrchestratorAgent } from "./agents/lean-canvas-orchestrator-agent";
import { firstCustomerAgent } from "./agents/first-customer-agent";
import { problemDiscoveryAgent } from "./agents/problem-discovery-agent";

export const mastra = new Mastra({
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
    default: { enabled: false },
  },
});
