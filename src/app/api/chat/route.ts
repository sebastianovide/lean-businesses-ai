import { mastra } from "@/mastra";
import { NextResponse } from "next/server";
import { convertMessages } from "@mastra/core/agent";
import { PinoLogger } from "@mastra/loggers";

const leanAgent = mastra.getAgent("leanAgent");
const logger = new PinoLogger({ name: "ChatAPI", level: "info" });

export async function POST(req: Request) {
  const { messages } = await req.json();

  logger.info("Messages sent to agent", { messages });

  try {
    const response = await leanAgent.generate(messages, {
      memory: {
        thread: "lean-user-id",
        resource: "lean-chat",
      },
    });

    logger.info("Agent response received", { response: response.text });

    return NextResponse.json({
      role: "assistant",
      content: response.text,
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

export async function GET() {
  const memory = await leanAgent.getMemory();

  try {
    const response = await memory?.query({
      threadId: "lean-user-id",
      resourceId: "lean-chat",
    });

    logger.info("Memory query result", {
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
