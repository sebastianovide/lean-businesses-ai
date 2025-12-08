import { mastra } from "@/mastra";
import { NextResponse } from "next/server";
import { PinoLogger } from "@mastra/loggers";
import { createUIMessageStreamResponse } from "ai";
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

interface MessagePart {
  type: string;
  text?: string;
}

function convertCanvasStateToString(canvasState: CanvasSection[] | any) {
  let canvasString = "=== Start of Lean Canvas State ===\n";

  // Handle both array and object formats
  let sections: CanvasSection[];

  if (Array.isArray(canvasState)) {
    sections = canvasState;
  } else if (typeof canvasState === "object" && canvasState !== null) {
    // Convert object format to array format
    sections = Object.values(canvasState);
  } else {
    sections = [];
  }

  sections
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

  // Extract text from message (supports both UIMessage and simple formats)
  const lastMessage = messages[messages.length - 1];
  const messageText =
    lastMessage.parts?.find((p: MessagePart) => p.type === "text")?.text ||
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
    logger.info("Canvas state", { canvasState });
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
