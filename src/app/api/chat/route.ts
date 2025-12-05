import { mastra } from "@/mastra";
import { NextResponse } from "next/server";
import { PinoLogger } from "@mastra/loggers";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { toAISdkFormat } from "@mastra/ai-sdk";
import { RuntimeContext } from "@mastra/core/runtime-context";

const leanCanvasOrchestratorAgent = mastra.getAgent(
  "leanCanvasOrchestratorAgent"
);
const logger = new PinoLogger({ name: "ChatAPI", level: "info" });

// Canvas state types
interface CanvasSection {
  id: string;
  order: number;
  title?: string;
  items?: string[];
  subsections?: { title: string; items: string[] }[];
}

function convertCanvasStateToString(canvasState: CanvasSection[]) {
  let canvasString = "=== Start of Lean Canvas State ===\n";

  canvasState
    .sort((a, b) => a.order - b.order)
    .forEach((section) => {
      canvasString += `## ${section.title}\n\n`;
      section.items?.forEach((item) => {
        canvasString += `* ${item}\n`;
      });
      if ((section.items?.length ?? 0) > 0) {
        canvasString += "\n";
      }

      section.subsections?.forEach((subsection) => {
        canvasString += `### ${subsection.title}:\n\n`;
        subsection.items?.forEach((item) => {
          canvasString += `* ${item}\n`;
        });
        if ((subsection.items?.length ?? 0) > 0) {
          canvasString += "\n";
        }
      });
    });

  canvasString += "\n=== End of Lean Canvas State ===\n";

  return canvasString;
}

export async function POST(req: Request) {
  const { messages, canvasId, canvasState } = await req.json();

  if (!canvasId) {
    return NextResponse.json(
      { error: "canvasId is required" },
      { status: 400 }
    );
  }

  const lastMessage = messages?.[messages.length - 1];
  if (!lastMessage) {
    return NextResponse.json({ error: "No message provided" }, { status: 400 });
  }

  // Extract text from message (supports both UIMessage and simple formats)
  const messageText =
    lastMessage.parts?.find((p: any) => p.type === "text")?.text ||
    lastMessage.content ||
    "";

  if (!messageText) {
    return NextResponse.json(
      { error: "No message text found" },
      { status: 400 }
    );
  }

  try {
    const runtimeContext = new RuntimeContext();
    runtimeContext.set("canvasState", convertCanvasStateToString(canvasState));

    const networkStream = await leanCanvasOrchestratorAgent.network(
      messageText,
      {
        memory: {
          thread: canvasId,
          resource: "lean-chat",
        },
        runtimeContext,
        maxSteps: 3,
      }
    );

    return createUIMessageStreamResponse({
      stream: toAISdkFormat(networkStream, { from: "network" }),
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error("Chat route error", { error: err.message, canvasId });

    return NextResponse.json(
      { error: "Failed to process chat request", details: err.message },
      { status: 500 }
    );
  }
}