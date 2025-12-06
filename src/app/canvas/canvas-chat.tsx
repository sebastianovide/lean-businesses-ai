"use client";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
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
  canvasId: string;
  canvasState: any;
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
      input?: any;
      output?: string | null;
    }>;
    output?: string | null;
    usage?: any;
  };
}

export default function CanvasChat({
  isOpen,
  onClose,
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

  console.info("messages, status", { messages, status });

  const handleSubmit = () => {
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Canvas Chat</h2>
          {status === "streaming" && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Responding...
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
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
                (p) => p.type === "text" && (p as any).text?.trim()
              );

              const finalText = textParts?.[textParts.length - 1]
                ? (textParts[textParts.length - 1] as any).text
                : undefined;

              const isLastMessage = msgIdx === messages.length - 1;

              return (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {/* User message - just show text */}
                    {message.role === "user" && <span>{finalText}</span>}

                    {/* Assistant message - show reasoning + response */}
                    {message.role === "assistant" && (
                      <>
                        {/* Show agent thinking */}
                        {dataNetworkPart &&
                          dataNetworkPart.data.steps &&
                          dataNetworkPart.data.steps.length > 0 && (
                            <div className="mb-4">
                              <Reasoning
                                isStreaming={
                                  isLastMessage &&
                                  dataNetworkPart.data.status === "running" &&
                                  status === "streaming"
                                }
                              >
                                <ReasoningTrigger />
                                <ReasoningContent>
                                  {dataNetworkPart.data.steps
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
                                    .join("\n\n---\n\n")}
                                </ReasoningContent>
                              </Reasoning>
                            </div>
                          )}

                        {/* Show final response - clearly separated */}
                        {dataNetworkPart?.data.status === "finished" &&
                          dataNetworkPart.data.output && (
                            <div className="mt-4 pt-4 border-t">
                              <MessageResponse>
                                {dataNetworkPart.data.output}
                              </MessageResponse>
                            </div>
                          )}

                        {/* Fallback if no data-network but has text */}
                        {!dataNetworkPart && finalText && (
                          <MessageResponse>{finalText}</MessageResponse>
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