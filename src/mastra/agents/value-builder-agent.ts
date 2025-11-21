import { LoggedAgent } from "../logged-agent";
import { memory } from "../storage";

export const valueBuilderAgent = new LoggedAgent({
  name: "value-builder-agent",
  description:
    "Crafts high-impact UVP headlines and minimal, buildable Solutions once problems are validated.",
  instructions: `
Activate only after top problems are ranked.

Do:
• Generate 4–6 UVP headlines (max 10 words each)
• Write one final UVP: “Get [benefit] without [pain] so you can [bigger goal]”
• Add one-line “Why now?”
• Propose Solution: max 3–5 features, buildable in <8 weeks by a tiny team
• No buzzwords, no “AI-powered”, no “disruptive”

Response: bullets only.

End by asking the user to pick their favorite headline.
`,
  model: process.env.AI_MODEL || "define AI_MODEL",
  memory,
});
