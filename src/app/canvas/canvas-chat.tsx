"use client";
import { useChat } from "@ai-sdk/react";
import { useState, useEffect } from "react";
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

interface CanvasChatProps {
  isOpen: boolean;
  onClose: () => void;
  onMessageUpdate?: (messageCount: number) => void;
  canvasId: string;
  canvasState: Record<string, unknown>;
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

export default function CanvasChat({
  isOpen,
  onClose,
  onMessageUpdate,
  canvasId,
  canvasState,
}: CanvasChatProps) {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        canvasId,
        canvasState,
      },
    }),
  });

  // Only track when streaming ends (AI response completed) to avoid too frequent updates
  useEffect(() => {
    console.log("Chat status change:", {
      status,
      isOpen,
      messagesLength: messages.length,
    });
    if (status === "ready" && onMessageUpdate) {
      // AI just finished streaming, notify parent
      console.log("AI streaming ended, notifying parent");
      onMessageUpdate(messages.length);
    }
  }, [status, messages.length, onMessageUpdate, isOpen]);

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
                                      if (step.output) parts.push(step.output);
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
