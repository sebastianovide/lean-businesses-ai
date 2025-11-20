import { mastra } from "@/mastra";
import { NextResponse } from "next/server";
import { toAISdkFormat } from "@mastra/ai-sdk";
import { convertMessages } from "@mastra/core/agent";
import { createUIMessageStreamResponse } from "ai";

const leanAgent = mastra.getAgent("leanAgent");

export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = await leanAgent.stream(messages, {
    memory: {
      thread: "lean-user-id",
      resource: "lean-chat",
    },
  });

  return createUIMessageStreamResponse({
    stream: toAISdkFormat(stream, { from: "agent" }),
  });
}

export async function GET() {
  const memory = await leanAgent.getMemory();

  try {
    const response = await memory?.query({
      threadId: "lean-user-id",
      resourceId: "lean-chat",
    });

    const uiMessages = convertMessages(response?.uiMessages ?? []).to(
      "AIV5.UI"
    );
    return NextResponse.json(uiMessages);
  } catch (error) {
    // Return empty array if thread doesn't exist yet
    return NextResponse.json([]);
  }
}
