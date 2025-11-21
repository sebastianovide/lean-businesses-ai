
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from "@mastra/loggers";
import { leanAgent } from "./agents/lean-agent";
import { storage } from "./storage";

export const mastra = new Mastra({
  workflows: {},
  agents: { leanAgent },
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
