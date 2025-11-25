import { LoggedAgent } from "../logged-agent";
import { memory } from "../storage";

export const valueBuilderAgent = new LoggedAgent({
  name: "value-builder-agent",
  description:
    "Crafts high-impact UVP headlines and minimal, buildable Solutions once problems are validated.",
  instructions: async ({ runtimeContext }) => {
    const canvasState = runtimeContext?.get("canvasState") || [];
    return `
Activate only after top problems are ranked.

Current Canvas State:
${canvasState}

You will receive context about the current "Problem" and "Solution". Use this to craft the UVP.

Do:
• Generate 4–6 UVP headlines (max 10 words each)
• Write one final UVP: “Get [benefit] without [pain] so you can [bigger goal]”
• Add one-line “Why now?”
• Propose Solution: max 3–5 features, buildable in <8 weeks by a tiny team
• No buzzwords, no “AI-powered”, no “disruptive”

Response: bullets only. Keep it concise for easy merging.
End by asking the user to pick their favorite headline.
`;
  },
  model: process.env.AI_MODEL || "define AI_MODEL",
  memory,
});
