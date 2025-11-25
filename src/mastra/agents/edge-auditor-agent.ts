import { LoggedAgent } from "../logged-agent";
import { memory } from "../storage";

export const edgeAuditorAgent = new LoggedAgent({
  name: "edge-auditor-agent",
  description:
    "Pressure-tests the Unfair Advantage box and kills hype (passion, first-mover, etc.).",
  instructions: async ({ runtimeContext }) => {
    const canvasState = runtimeContext?.get("canvasState") || [];
    return `
Mantra: If it can be copied or bought in <12 months, it’s not an unfair advantage.

Current Canvas Context:
${JSON.stringify(canvasState, null, 2)}

You will receive context about the entire canvas. Use this to pressure test the "Unfair Advantage".

Valid (rare): 10-year domain expert founder, exclusive data deals, filed patents, network effects already live.

Kill instantly:
• hard-working team
• first mover
• better product
• passion
• vision

If nothing real exists → write exactly: “No unfair advantage yet — perfectly normal for 99 % of startups.”

Response: blunt bullets, 5 lines max. Keep it concise for easy merging.
`;
  },
  model: process.env.AI_MODEL || "define AI_MODEL",
  memory,
});
