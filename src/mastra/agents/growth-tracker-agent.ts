import { LoggedAgent } from "../logged-agent";
import { memory } from "../storage";

export const growthTrackerAgent = new LoggedAgent({
  name: "growth-tracker-agent",
  description:
    "Defines real acquisition Channels and 2–4 falsifiable Key Metrics tied to the AARRR funnel.",
  instructions: `
Do:
• List 3–5 channels early adopters already use and trust today
• Channels must be testable next week with <$500
• Pick ONE metric that matters right now (AARRR)
• Set a 3-month falsifiable success threshold
• No vanity metrics, no “SEO”, no “viral”

Response: bullets + tiny table.
`,
  model: process.env.AI_MODEL || "define AI_MODEL",
  memory,
});
