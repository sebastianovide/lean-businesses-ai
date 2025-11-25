import { mastra } from "@/mastra";
import { NextResponse } from "next/server";
import { convertMessages } from "@mastra/core/agent";
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

export async function POST(req: Request) {
  const { messages, canvasId, canvasState } = await req.json();

  logger.info("Messages sent to agent", { messages, canvasId, canvasState });

  if (!canvasId) {
    return NextResponse.json(
      { error: "canvasId is required" },
      { status: 400 }
    );
  }

  // Extract the last user message from the messages array
  const lastMessage =
    messages && messages.length > 0 ? messages[messages.length - 1] : null;

  if (!lastMessage) {
    return NextResponse.json({ error: "No message provided" }, { status: 400 });
  }

  // Extract text from UIMessage format (parts array)
  let messageText = "";
  if (lastMessage.parts && Array.isArray(lastMessage.parts)) {
    // UIMessage format from useChat
    const textPart = lastMessage.parts.find(
      (part: any) => part.type === "text"
    );
    messageText = textPart?.text || "";
  } else if (typeof lastMessage.content === "string") {
    // Fallback for simple message format
    messageText = lastMessage.content;
  }

  logger.info("Processing message", {
    totalMessages: messages?.length || 0,
    messageText,
    allMessageRoles: messages?.map((m: any) => m.role) || [],
  });

  if (!messageText) {
    return NextResponse.json(
      { error: "No message text found" },
      { status: 400 }
    );
  }

  try {
    // Note: We only pass the NEW user message here.
    // Mastra's memory system automatically retrieves the last 10 messages
    // from the database based on the thread/resource configuration.

    // Create runtime context with canvas state
    const runtimeContext = new RuntimeContext();
    runtimeContext.set("canvasState", canvasState);

    logger.info("r untimeContext", {
      runtimeContext,
    });

    const networkStream = await leanCanvasOrchestratorAgent.network(
      messageText,
      {
        memory: {
          thread: canvasId,
          resource: "lean-chat",
        },
        runtimeContext,
        maxSteps: 10, // Allow proper delegation: route → delegate → process → synthesize → respond
      }
    );

    // Transform stream into AI SDK format and create UI messages stream
    const aiSdkStream = toAISdkFormat(networkStream, { from: "network" });

    if (!aiSdkStream) {
      throw new Error("Failed to convert network stream to AI SDK format");
    }

    const uiMessageStream = createUIMessageStream({
      execute: async ({ writer }) => {
        const reader = aiSdkStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            writer.write(value);
          }
        } finally {
          reader.releaseLock();
        }
      },
    });

    // Create a Response that streams the UI message stream to the client
    return createUIMessageStreamResponse({
      stream: uiMessageStream,
    });
  } catch (error: unknown) {
    // Enhanced error logging
    const err = error as Error;
    console.error("❌ CHAT API ERROR - Full Details:");
    console.error("Error type:", err?.constructor?.name);
    console.error("Error message:", err?.message);
    console.error("Error stack:", err?.stack);
    console.error("Input - canvasId:", canvasId);
    console.error("Input - lastMessage:", JSON.stringify(lastMessage, null, 2));
    console.error("Input - canvasState:", JSON.stringify(canvasState, null, 2));

    logger.error("Error in chat route", {
      error,
      errorMessage: err?.message,
      errorStack: err?.stack,
      canvasId,
    });

    return NextResponse.json(
      {
        error: "Failed to process chat request. Check server logs for details.",
        details: err?.message || "Unknown error",
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
