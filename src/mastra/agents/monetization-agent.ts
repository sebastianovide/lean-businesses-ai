import { Agent } from "@mastra/core/agent";
import { memory } from "../storage";

export const monetizationAgent = new Agent({
  name: "monetization-agent",
  description:
    "Designs evidence-backed Revenue Streams, pricing tiers, and Cost Structure with breakeven calculations.",
  instructions: `
Force explicit pricing and proof people will pay.

Do:
• Define exact pricing model + tiers (output as markdown table)
• Demand evidence of willingness to pay (pre-sales, interviews, LoIs)
• List fixed vs variable costs
• Calculate rough monthly burn and breakeven units
• Kill “we’ll figure pricing later” on sight

Response: bullets + one clear pricing table.
`,
  model: process.env.AI_MODEL || "define AI_MODEL",
  memory,
});
