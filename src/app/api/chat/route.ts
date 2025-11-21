import { mastra } from "@/mastra";
import { NextResponse } from "next/server";
import { convertMessages } from "@mastra/core/agent";
import { PinoLogger } from "@mastra/loggers";

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

// Helper to format canvas state for agent context
function formatCanvasState(canvas: CanvasSection[]): string {
  const sortedSections = [...canvas].sort((a, b) => a.order - b.order);

  return sortedSections
    .map((section) => {
      const sectionTitle = section.title || section.id;

      if (section.subsections) {
        const subsectionContent = section.subsections
          .map((sub) => {
            const items = sub.items.filter(Boolean);
            return `  **${sub.title}**:\n${
              items.length > 0
                ? items.map((item) => `    - ${item}`).join("\n")
                : "    (empty)"
            }`;
          })
          .join("\n\n");
        return `### ${section.order}. ${sectionTitle}\n${subsectionContent}`;
      } else {
        const items = (section.items || []).filter(Boolean);
        return `### ${section.order}. ${sectionTitle}\n${
          items.length > 0
            ? items.map((item) => `  - ${item}`).join("\n")
            : "  (empty)"
        }`;
      }
    })
    .join("\n\n");
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

  try {
    // CRITICAL FIX: Limit conversation history to prevent token explosion
    // Only keep the last 10 messages to avoid exceeding token limits
    const recentMessages = messages.slice(-10);

    // CRITICAL FIX: Simplify canvas state - only send summary, not full content
    const canvasSummary = canvasState
      ? `Canvas sections filled: ${
          canvasState.filter((s: any) => {
            if (s.items && s.items.length > 0) return true;
            if (s.subsections) {
              return s.subsections.some(
                (sub: any) => sub.items && sub.items.length > 0
              );
            }
            return false;
          }).length
        }/9`
      : "Canvas is empty";

    // Build context message - MUCH SIMPLER
    const contextMessage = {
      role: "system" as const,
      content: `${canvasSummary}

Keep responses concise (max 3-4 sentences). Focus on actionable next steps.`,
    };

    // Inject context as the first message
    const messagesWithContext = [contextMessage, ...recentMessages];

    const stream = await leanCanvasOrchestratorAgent.network(
      messagesWithContext,
      {
        memory: {
          thread: canvasId,
          resource: "lean-chat",
        },
        maxSteps: 2, // REDUCED from 5 to prevent loops
      }
    );

    logger.info("Agent stream received");

    // Create a ReadableStream to send events to the client
    const encoder = new TextEncoder();
    let insideThinkBlock = false; // Track if we're inside a <think> block
    let textBuffer = ""; // Buffer to accumulate text for think tag detection
    let agentDepth = 0; // Track agent recursion depth

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const reader = stream.getReader();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Send different event types to the client
            if (value?.type === "agent-execution-event-start") {
              // Agent started
              agentDepth++;
              logger.info("Agent start event", {
                fullPayload: JSON.stringify(value?.payload),
                agentName: value?.payload?.agentName,
                name: value?.payload?.name,
                agent: value?.payload?.agent,
                depth: agentDepth,
              });
            } else if (value?.type === "agent-execution-event-text-delta") {
              // Text chunk - filter out <think> tags (internal reasoning)

              // Try to identify the agent from the payload
              const payloadAgentName =
                value?.payload?.agentName ||
                value?.payload?.name ||
                value?.payload?.agent?.name ||
                value?.payload?.agent;

              // Only process text from the main agent
              // If we can identify the agent, it MUST be the orchestrator
              // If we can't identify the agent, we rely on depth
              const isOrchestrator = payloadAgentName
                ? payloadAgentName === "lean-canvas-orchestrator-agent"
                : agentDepth === 1;

              if (isOrchestrator) {
                let text =
                  value?.payload?.payload?.text || value?.payload?.text;
                if (text) {
                  textBuffer += text;

                  // Process the buffer to extract only non-think content
                  let outputText = "";
                  let remainingBuffer = textBuffer;

                  while (remainingBuffer.length > 0) {
                    if (insideThinkBlock) {
                      // Look for closing tag
                      const closeIndex = remainingBuffer.indexOf("</think>");
                      if (closeIndex !== -1) {
                        // Found closing tag, skip everything up to and including it
                        remainingBuffer = remainingBuffer.slice(closeIndex + 8);
                        insideThinkBlock = false;
                      } else {
                        // No closing tag yet, skip all remaining text
                        remainingBuffer = "";
                        break;
                      }
                    } else {
                      // Look for opening tag
                      const openIndex = remainingBuffer.indexOf("<think>");
                      if (openIndex !== -1) {
                        // Found opening tag, output everything before it
                        outputText += remainingBuffer.slice(0, openIndex);
                        remainingBuffer = remainingBuffer.slice(openIndex + 7);
                        insideThinkBlock = true;
                      } else {
                        // No opening tag, check if we might have a partial tag at the end
                        const possiblePartialTag = remainingBuffer.slice(-10);
                        if (
                          possiblePartialTag.includes("<") &&
                          "<think>".startsWith(
                            possiblePartialTag.slice(
                              possiblePartialTag.lastIndexOf("<")
                            )
                          )
                        ) {
                          // Might be a partial opening tag, keep it in buffer
                          const lastLessThan = remainingBuffer.lastIndexOf("<");
                          outputText += remainingBuffer.slice(0, lastLessThan);
                          remainingBuffer = remainingBuffer.slice(lastLessThan);
                          break;
                        } else {
                          // No partial tag, output everything
                          outputText += remainingBuffer;
                          remainingBuffer = "";
                        }
                      }
                    }
                  }

                  textBuffer = remainingBuffer;

                  // Send the filtered text
                  if (outputText) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: "text-delta",
                          text: outputText,
                        })}\n\n`
                      )
                    );
                  }
                }
              }
            } else if (value?.type === "agent-execution-event-finish") {
              // Agent finished
              agentDepth--;
              logger.info("Agent finish event", {
                fullPayload: JSON.stringify(value?.payload),
                depth: agentDepth,
              });
            } else if (value?.type === "agent-execution-event-tool-call") {
              // Tool/Agent delegation
              // We don't send this to the client anymore to reduce noise
              logger.info("Tool call event", {
                toolName: value?.payload?.toolName,
              });
            }
          }

          // Send completion event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );
          controller.close();
        } catch (error) {
          logger.error("Stream error", { error });
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
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
