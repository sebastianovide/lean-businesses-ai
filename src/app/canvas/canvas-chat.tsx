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
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { CollapsibleContent } from "@/components/ui/collapsible";
import { Loader } from "@/components/ai-elements/loader";
import { DefaultChatTransport } from "ai";
import { CanvasState } from "./types";
import { useCanvasContext } from "@/contexts/canvas-context";
import { CopyIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Using 'as any' for these components to bypass incorrect "multiple children" lint errors
// that stem from complex type interactions (React 19 + internal component typings)
const AssistantMessageResponse = MessageResponse as any;

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

export default function CanvasChat({
  isOpen,
  onClose,
  onMessageUpdate,
  canvasId,
  canvasState,
}: CanvasChatProps) {
  const { applyToolChanges } = useCanvasContext();
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

  const appliedToolCallIds = useRef<Set<string>>(new Set());

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
          const isStepComplete =
            step.status === "success" ||
            (step.output && step.output.length > 0);

          if (isStepComplete && !appliedToolCallIds.current.has(callId)) {
            try {
              if (step.output) {
                let output;
                if (typeof step.output === "object") {
                  output = step.output;
                } else {
                  try {
                    output = JSON.parse(step.output);
                  } catch (e) {}
                }

                if (output) {
                  const changes = output.changes || output.result?.changes;
                  if (changes && Array.isArray(changes)) {
                    applyToolChanges(changes);
                    appliedToolCallIds.current.add(callId);
                  }
                }
              }
            } catch (e) {
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
      onMessageUpdate(messages.length);
    }
  }, [status, messages, applyToolChanges, onMessageUpdate]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-background border-l shadow-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">Canvas Co-pilot</h2>
          {status !== "ready" && (
            <div className="flex items-center gap-1.5 ">
              <Loader size={12} className="text-primary" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground animate-pulse">
                {status === "streaming" ? "Typing..." : "Thinking..."}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors"
        >
          <XIcon size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <Conversation className="h-full">
          <ConversationContent className="p-4 space-y-6">
            {messages.map((message, msgIdx) => {
              const isLastMessage = msgIdx === messages.length - 1;

              return (
                <div key={message.id} className="space-y-4">
                  {message.parts?.map((part, partIdx) => {
                    const partKey = `${message.id}-${partIdx}`;

                    if (part.type === "text") {
                      return (
                        <Message key={partKey} from={message.role}>
                          <MessageContent>
                            <AssistantMessageResponse>
                              {part.text}
                            </AssistantMessageResponse>
                          </MessageContent>
                          {message.role === "assistant" && (
                            <MessageActions>
                              <MessageAction
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text)
                                }
                                label="Copy"
                              >
                                <CopyIcon size={12} />
                              </MessageAction>
                            </MessageActions>
                          )}
                        </Message>
                      );
                    }

                    if (part.type === "data-network") {
                      const dataNetwork = part as DataNetworkPart;
                      return (
                        <div key={partKey} className="space-y-4">
                          <Reasoning
                            isStreaming={
                              status === "streaming" && isLastMessage
                            }
                            defaultOpen={msgIdx === messages.length - 1}
                            className="w-full"
                          >
                            <ReasoningTrigger />
                            {/* Using CollapsibleContent directly instead of ReasoningContent 
                                because ReasoningContent only accepts a string (markdown) 
                                but we need to render tool steps as JSX. */}
                            <CollapsibleContent
                              className={cn(
                                "mt-4 text-sm",
                                "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-muted-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in"
                              )}
                            >
                              {dataNetwork.data.steps &&
                              dataNetwork.data.steps.length > 0 ? (
                                <div className="space-y-3">
                                  {dataNetwork.data.steps.map((step, sIdx) => {
                                    let outputMsg = "";
                                    if (step.output) {
                                      try {
                                        const parsed =
                                          typeof step.output === "string"
                                            ? JSON.parse(step.output)
                                            : step.output;
                                        outputMsg =
                                          parsed.message ||
                                          (typeof parsed === "string"
                                            ? parsed
                                            : "");
                                      } catch (e) {}
                                    }

                                    return (
                                      <div
                                        key={sIdx}
                                        className="text-xs border-l-2 border-primary/20 pl-2 py-1"
                                      >
                                        <div className="font-semibold text-primary/80">
                                          {step.name}
                                        </div>
                                        {outputMsg && (
                                          <div className="mt-1 opacity-80">
                                            {outputMsg}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                "Analyzing canvas context..."
                              )}
                            </CollapsibleContent>
                          </Reasoning>

                          {dataNetwork.data.status === "finished" &&
                            dataNetwork.data.output && (
                              <Message from="assistant">
                                <MessageContent>
                                  <AssistantMessageResponse>
                                    {dataNetwork.data.output}
                                  </AssistantMessageResponse>
                                </MessageContent>
                                <MessageActions>
                                  <MessageAction
                                    onClick={() =>
                                      navigator.clipboard.writeText(
                                        dataNetwork.data.output || ""
                                      )
                                    }
                                    label="Copy"
                                  >
                                    <CopyIcon size={12} />
                                  </MessageAction>
                                </MessageActions>
                              </Message>
                            )}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              );
            })}
            {status === "submitted" && (
              <div className="flex justify-center p-4">
                <Loader size={20} className="text-muted-foreground/50" />
              </div>
            )}
            <ConversationScrollButton />
          </ConversationContent>
        </Conversation>
      </div>

      <div className="p-4 bg-background border-t">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Improve the canvas..."
              className="min-h-[80px]"
            />
          </PromptInputBody>
          <PromptInputFooter>
            <div className="flex-1" />
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
