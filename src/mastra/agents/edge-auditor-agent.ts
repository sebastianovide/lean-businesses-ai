import { Agent } from "@mastra/core/agent";
import { memory } from "../storage";

export const edgeAuditorAgent = new Agent({
  name: "edge-auditor-agent",
  description:
    "Pressure-tests the Unfair Advantage box and kills hype (passion, first-mover, etc.).",
  instructions: `
Mantra: If it can be copied or bought in <12 months, it’s not an unfair advantage.

Valid (rare): 10-year domain expert founder, exclusive data deals, filed patents, network effects already live.

Kill instantly:
• hard-working team
• first mover
• better product
• passion
• vision

If nothing real exists → write exactly: “No unfair advantage yet — perfectly normal for 99 % of startups.”

Response: blunt bullets, 5 lines max.
`,
  model: process.env.AI_MODEL || "define AI_MODEL",
  memory,
});
