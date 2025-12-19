"use client";
import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useRef } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { DefaultChatTransport } from "ai";
import { CanvasState } from "./types";

interface CanvasChatProps {
  isOpen: boolean;
  onClose: () => void;
  onMessageUpdate?: (messageCount: number) => void;
  canvasId: string;
  canvasState: CanvasState;
}

interface DataNetworkPart {
  type: "data-network";
  id: string;
  data: {
    name: string;
    status: "running" | "finished" | "error";
    steps?: Array<{
      name: string;
      status: "running" | "success" | "error";
      input?: Record<string, unknown>;
      output?: string | null;
    }>;
    output?: string | null;
    usage?: Record<string, unknown>;
  };
}

import { useCanvasContext } from "@/contexts/canvas-context";

export default function CanvasChat({
  isOpen,
  onClose,
  onMessageUpdate,
  canvasId,
  canvasState,
}: CanvasChatProps) {
  const { applyToolChanges } = useCanvasContext();
  const [input, setInput] = useState("");

  // Debug: Log canvas state to verify it's being passed correctly
  useEffect(() => {
    console.log("CanvasChat - Canvas State:", canvasState);
    console.log("CanvasChat - Canvas State keys:", Object.keys(canvasState));
  }, [canvasState]);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        canvasId,
        canvasState,
      },
    }),
  });

  // Track processed tool calls to avoid double-applying
  const appliedToolCallIds = useRef<Set<string>>(new Set());

  // Monitor messages for tool changes and apply them
  useEffect(() => {
    if (status !== "ready") return;

    messages.forEach((message) => {
      if (message.role !== "assistant") return;

      const dataNetworkPart = message.parts?.find(
        (p) => p.type === "data-network"
      ) as DataNetworkPart | undefined;

      if (dataNetworkPart?.data.steps) {
        dataNetworkPart.data.steps.forEach((step, index) => {
          const callId = `${message.id}-${index}`;

          // Check if step is done or has output
          const isStepComplete =
            step.status === "success" ||
            (step.output && step.output.length > 0);

          if (isStepComplete && !appliedToolCallIds.current.has(callId)) {
            try {
              // The output of Mastra tools is expected to be a stringified JSON
              // that contains a 'changes' array
              console.log("Processing tool step:", step);
              if (step.output) {
                console.log("Raw step output:", step.output);
                let output;

                if (typeof step.output === "object") {
                  output = step.output;
                } else {
                  try {
                    output = JSON.parse(step.output);
                  } catch (e) {
                    console.log("Failed to parse step output as JSON:", e);
                  }
                }

                if (output) {
                  console.log("Parsed output:", output);
                  // Handle both direct changes and nested result.changes
                  const changes = output.changes || output.result?.changes;

                  if (changes && Array.isArray(changes)) {
                    console.log(
                      `Applying ${changes.length} changes from tool: ${step.name}`,
                      changes
                    );
                    applyToolChanges(changes);
                    appliedToolCallIds.current.add(callId);
                  } else {
                    console.log("No 'changes' array found in output");
                  }
                }
              }
            } catch (e) {
              // Not all tool outputs are JSON or contain changes, which is fine
              console.debug(
                `Skipping non-state-changing tool output for ${step.name}`,
                e
              );
            }
          }
        });
      }
    });

    if (onMessageUpdate) {
      console.log("AI streaming ended, notifying parent");
      onMessageUpdate(messages.length);
    }
  }, [status, messages, applyToolChanges, onMessageUpdate]);

  console.info("messages, status", { messages, status });

  const handleSubmit = () => {
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div
      className={`fixed bottom-6 right-6 w-96 h-[600px] bg-background border shadow-lg rounded-lg flex flex-col z-50 ${
        isOpen
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
          : "opacity-0 translate-y-4 scale-95 pointer-events-none"
      }`}
      style={{
        animation: isOpen
          ? "slideInFromBottom 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
          : "slideOutToBottom 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg cursor-move">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Canvas Chat</h2>
          {status !== "ready" && (
            <span className="text-xs text-muted-foreground animate-pulse">
              {status === "streaming" ? "Responding..." : "Thinking..."}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <Conversation>
          <ConversationContent className="overflow-y-auto flex-1">
            {messages.map((message, msgIdx) => {
              // Extract reasoning and final text
              const dataNetworkPart = message.parts?.find(
                (p) => p.type === "data-network"
              ) as DataNetworkPart | undefined;

              const textParts = message.parts?.filter(
                (p): p is { type: "text"; text: string } =>
                  p.type === "text" && !!(p as { text?: string }).text?.trim()
              );

              const finalText = textParts?.[textParts.length - 1]?.text;

              const isLastMessage = msgIdx === messages.length - 1;

              return (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {/* User message - just show text */}
                    {message.role === "user" && <span>{finalText}</span>}

                    {/* Assistant message - show reasoning + response */}
                    {message.role === "assistant" && (
                      <>
                        {/* Show agent thinking - always visible for assistant messages */}
                        <div className="mb-4">
                          <Reasoning
                            isStreaming={
                              status === "streaming" && isLastMessage
                            }
                            defaultOpen={true}
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>
                              {dataNetworkPart &&
                              dataNetworkPart.data.steps &&
                              dataNetworkPart.data.steps.length > 0
                                ? dataNetworkPart.data.steps
                                    .map((step) => {
                                      const parts = [`**${step.name}**`];
                                      if (step.output) {
                                        let outputObj = step.output;
                                        if (typeof step.output === "string") {
                                          try {
                                            outputObj = JSON.parse(step.output);
                                          } catch (e) {
                                            // Keep as string if parse fails
                                          }
                                        }

                                        // Prefer the user-friendly message if available
                                        if (
                                          outputObj &&
                                          typeof outputObj === "object" &&
                                          "message" in outputObj
                                        ) {
                                          // Only show the friendly message, don't show the tool name
                                          parts.pop(); // Remove the tool name added at start
                                          parts.push(
                                            `✅ **${
                                              (outputObj as { message: string })
                                                .message
                                            }**`
                                          );
                                        } else {
                                          const outputStr =
                                            typeof step.output === "object"
                                              ? JSON.stringify(
                                                  step.output,
                                                  null,
                                                  2
                                                )
                                              : step.output;
                                          parts.push(outputStr);
                                        }
                                      }
                                      if (step.input?.selectionReason) {
                                        parts.push(
                                          `*Why: ${step.input.selectionReason}*`
                                        );
                                      }
                                      return parts.join("\n\n");
                                    })
                                    .join("\n\n---\n\n")
                                : "AI is processing your request..."}
                            </ReasoningContent>
                          </Reasoning>
                        </div>

                        {/* Show final response - with similar background to user but different color */}
                        {dataNetworkPart?.data.status === "finished" &&
                          dataNetworkPart.data.output && (
                            <div className="mt-2 bg-muted rounded-lg px-4 py-3">
                              <MessageResponse>
                                {dataNetworkPart.data.output}
                              </MessageResponse>
                            </div>
                          )}

                        {/* Fallback if no data-network but has text */}
                        {!dataNetworkPart && finalText && (
                          <div className="mt-2 bg-muted rounded-lg px-4 py-3">
                            <MessageResponse>{finalText}</MessageResponse>
                          </div>
                        )}
                      </>
                    )}
                  </MessageContent>
                </Message>
              );
            })}

            <ConversationScrollButton />
          </ConversationContent>
        </Conversation>
      </div>

      <div className="p-4 border-t">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your canvas..."
              disabled={status !== "ready"}
            />
            <PromptInputSubmit disabled={status !== "ready"} />
          </PromptInputBody>
        </PromptInput>
      </div>
    </div>
  );
}
