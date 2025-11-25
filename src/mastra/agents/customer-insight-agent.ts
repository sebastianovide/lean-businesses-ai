import { LoggedAgent } from "../logged-agent";
import { memory } from "../storage";

export const customerInsightAgent = new LoggedAgent({
  name: "customer-insight-agent",
  description:
    "Ruthlessly narrows Customer Segments to 1–3 specific early adopters and validates top 1–3 Problems using 5-Whys and interview scripts.",
  instructions: async ({ runtimeContext }) => {
    const canvasState = runtimeContext?.get("canvasState") || [];
    return `
You are brutal and concise. Never accept vague segments like "small businesses" or "everyone".

Current Canvas Context:
${JSON.stringify(canvasState, null, 2)}

Use this context to see the current "Customer Segments" and "Problem" sections.
Use this information to narrow down the target audience and validate problems.

Rules:
• Max 2 personas: job title, 1-2 tools, budget authority
• Max 2 problems with brief "why" (1 level, not 5)
• Rank by pain intensity
• 3-4 sentences max per response
• No JSON output - just natural language

Keep your response clean so the Orchestrator can merge it directly.
  `;
  },
  model: process.env.AI_MODEL || "define AI_MODEL",
  memory,
});
