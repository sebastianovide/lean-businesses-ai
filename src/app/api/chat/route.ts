import { mastra } from "@/mastra";
import { NextResponse } from "next/server";
import { PinoLogger } from "@mastra/loggers";
import { createUIMessageStreamResponse } from "ai";
import { toAISdkFormat } from "@mastra/ai-sdk";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { CanvasSection } from "@/app/canvas/types";

const leanCanvasOrchestratorAgent = mastra.getAgent(
  "leanCanvasOrchestratorAgent"
);
const logger = new PinoLogger({ name: "ChatAPI", level: "info" });

interface MessagePart {
  type: string;
  text?: string;
}

function convertCanvasStateToString(
  canvasState: Record<string, CanvasSection>
) {
  let canvasString = "=== Start of Lean Canvas State ===\n";

  // Convert object format to array format and sort by order
  const sections = Object.values(canvasState).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  sections.forEach((section) => {
    canvasString += `## ${section.title}\n\n`;
    section.items?.forEach((item) => {
      canvasString += `* ${item}\n`;
    });
    if ((section.items?.length ?? 0) > 0) {
      canvasString += "\n";
    }

    // Handle subsections as object format
    if (section.subsections) {
      Object.values(section.subsections).forEach((subsection) => {
        canvasString += `### ${subsection.title}:\n\n`;
        subsection.items?.forEach((item) => {
          canvasString += `* ${item}\n`;
        });
        if ((subsection.items?.length ?? 0) > 0) {
          canvasString += "\n";
        }
      });
    }
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
    const strCanvasState = convertCanvasStateToString(canvasState);
    logger.info("Canvas state", { strCanvasState });
    runtimeContext.set("canvasState", strCanvasState);
    runtimeContext.set("canvasId", canvasId);

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

    // Process the network stream to extract tool responses
    const stream = toAISdkFormat(networkStream, { from: "network" });

    return createUIMessageStreamResponse({
      stream: stream,
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
