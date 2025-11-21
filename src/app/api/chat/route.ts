import { mastra } from "@/mastra";
import { NextResponse } from "next/server";
import { convertMessages } from "@mastra/core/agent";
import { PinoLogger } from "@mastra/loggers";

const leanCanvasOrchestratorAgent = mastra.getAgent(
  "leanCanvasOrchestratorAgent"
);
const logger = new PinoLogger({ name: "ChatAPI", level: "info" });

export async function POST(req: Request) {
  const { messages, canvasId } = await req.json();

  logger.info("Messages sent to agent", { messages, canvasId });

  if (!canvasId) {
    return NextResponse.json(
      { error: "canvasId is required" },
      { status: 400 }
    );
  }

  try {
    const response = await leanCanvasOrchestratorAgent.network(messages, {
      memory: {
        thread: canvasId,
        resource: "lean-chat",
      },
      maxSteps: 5,
    });

    logger.info("Agent response received", {
      response: JSON.stringify(response, null, 2),
    });

    return NextResponse.json({
      role: "assistant",
      content: response.result,
    });
  } catch (error) {
    logger.error("Error in chat route", { error });
    return NextResponse.json(
      {
        error: "Failed to process chat request. Check server logs for details.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const canvasId = searchParams.get("canvasId");

  if (!canvasId) {
    return NextResponse.json(
      { error: "canvasId is required" },
      { status: 400 }
    );
  }

  const memory = await leanCanvasOrchestratorAgent.getMemory();

  try {
    const response = await memory?.query({
      threadId: canvasId,
      resourceId: "lean-chat",
    });

    logger.info("Memory query result", {
      canvasId,
      uiMessages: response?.uiMessages ?? [],
    });

    const uiMessages = convertMessages(response?.uiMessages ?? []).to(
      "AIV5.UI"
    );

    logger.info("Converted UI messages", { uiMessages });
    return NextResponse.json(uiMessages);
  } catch (error) {
    // Return empty array if thread doesn't exist yet
    return NextResponse.json([]);
  }
}
