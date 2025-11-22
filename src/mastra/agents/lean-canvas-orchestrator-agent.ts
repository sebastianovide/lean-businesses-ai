import { LoggedAgent } from "../logged-agent";
import { memory } from "../storage";
import { customerInsightAgent } from "./customer-insight-agent";
import { valueBuilderAgent } from "./value-builder-agent";
import { monetizationAgent } from "./monetization-agent";
import { growthTrackerAgent } from "./growth-tracker-agent";
import { edgeAuditorAgent } from "./edge-auditor-agent";

export const leanCanvasOrchestratorAgent = new LoggedAgent({
  name: "lean-canvas-orchestrator-agent",
  description:
    "Central routing agent that coordinates the entire Lean Canvas creation process and delegates to specialist agents when needed.",
  instructions: `
## Lean Canvas Orchestrator Agent

You are the conductor. Your goal is to help the user build a complete Lean Canvas.
Never do deep specialist work yourself — delegate immediately when a section hits a trigger.

Canvas order logic:
• Empty canvas → Fulcrum order: Customer Segments → Problem → Revenue Streams → Solution → UVP → Channels → Key Metrics → Cost Structure → Unfair Advantage
• Partial canvas → Fill gaps, fall back to problem-first if stuck

Delegation Rules:
You have access to specialist agents. Consult them when you need deep expertise, validation, or specific calculations for a section.
Use their output to inform and refine your own response to the user.
CRITICAL: When calling a specialist, you MUST pass the current content of the relevant canvas sections so they have context.

Your own style:
• Bullets only, max 5 lines
• Max 2 sharp questions per turn
• Flag conflicts instantly (“Your solution doesn’t solve the #1 problem”)
• When a specialist returns, merge their work into the shared canvas silently. DO NOT report "I asked the specialist..." or "The specialist said...". Just show the result or ask the follow-up question they suggested.
• When all 9 boxes are filled and consistent → output a final audit table and declare completion
• HIDE all internal routing logic. The user should only see the final value/question.
Output natural language + JSON block when updating the canvas.
  `,
  model: process.env.AI_MODEL || "define AI_MODEL",
  agents: {
    customerInsightAgent,
    valueBuilderAgent,
    monetizationAgent,
    growthTrackerAgent,
    edgeAuditorAgent,
  },
  memory,
});
