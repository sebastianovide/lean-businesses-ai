"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UIMessage, ChatStatus } from "ai";
import { CanvasSection } from "./types";



interface CanvasChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: UIMessage[];
  status: ChatStatus;
  error: Error | undefined;
  onSubmit: (message: string) => void;
  canvasId: string;
  canvasState: CanvasSection[];
}

export function CanvasChat({
  isOpen,
  onClose,
  messages,
  status,
  error,
  onSubmit,
  canvasId,
  canvasState,
}: CanvasChatProps) {
  const [chatWidth, setChatWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [collapsibleOpen, setCollapsibleOpen] = useState<
    Record<string, boolean>
  >({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Resize handlers
  const startResizing = React.useCallback(
    (mouseDownEvent: React.MouseEvent) => {
      mouseDownEvent.preventDefault();
      setIsResizing(true);
    },
    []
  );

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - mouseMoveEvent.clientX;
        if (newWidth > 300 && newWidth < 800) {
          setChatWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSubmit(inputValue);
    setInputValue("");
  };

  // Helper to format agent names for display
  const formatAgentName = (agentName: string): string => {
    return agentName
      .replace(/-agent$/i, "")
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Collapsible component for <think> blocks
  function Collapsible({
    label,
    children,
    open,
    onToggle,
    forceOpenNoToggle,
  }: {
    label: string;
    children: React.ReactNode;
    open: boolean;
    onToggle: () => void;
    forceOpenNoToggle?: boolean;
  }) {
    if (forceOpenNoToggle) {
      return (
        <div className="my-1">
          <div className="text-xs text-blue-600 font-semibold mb-1">
            {label}
          </div>
          <div className="mt-1 p-2 bg-gray-100 border border-gray-200 rounded text-xs whitespace-pre-line">
            {children}
          </div>
        </div>
      );
    }
    return (
      <div className="my-1">
        <button
          type="button"
          className="text-xs text-blue-600 underline hover:text-blue-800 focus:outline-none"
          onClick={onToggle}
        >
          {open ? "▼" : "▶"} {label}
        </button>
        {open && (
          <div className="mt-1 p-2 bg-gray-100 border border-gray-200 rounded text-xs whitespace-pre-line">
            {children}
          </div>
        )}
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .dot-typing {
          display: inline-block;
        }
        .dot-typing .dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          margin: 0 1px;
          background: #888;
          border-radius: 50%;
          animation: dot-typing 1s infinite linear alternate;
        }
        .dot-typing .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot-typing .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes dot-typing {
          0% { opacity: 0.2; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
          100% { opacity: 0.2; transform: translateY(0); }
        }
      `}</style>
      <aside
        className="bg-white border-l shadow-lg flex flex-col h-full z-10 transition-all duration-300 ease-in-out relative overflow-hidden"
        style={{ width: chatWidth }}
      >
        {/* Resize Handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-4 -ml-2 cursor-col-resize z-20 flex items-center justify-center group"
          onMouseDown={startResizing}
        >
          {/* Hover Line */}
          <div className="w-0.5 h-full bg-transparent group-hover:bg-blue-400 transition-colors" />

          {/* Grip Icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center z-30">
            <GripVertical size={12} className="text-gray-400" />
          </div>
        </div>

        <div
          className="p-4 border-b font-bold text-lg text-blue-700 flex items-center justify-between"
          style={{ minWidth: chatWidth }}
        >
          <span>AI Brainstorm Chat</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto p-4 space-y-2"
          style={{ minWidth: chatWidth }}
        >
          {messages.length === 0 && (
            <div className="text-gray-400 text-sm text-center">
              Start brainstorming with the AI!
            </div>
          )}
          {messages.map((msg: any, idx: number, arr: any[]) => {
            // Extract content from UIMessage format
            let messageContent = "";

            if (msg.parts && Array.isArray(msg.parts)) {
              // UIMessage format - extract text from parts
              for (const part of msg.parts) {
                if (part.type === "text" && part.text) {
                  messageContent += part.text;
                } else if (part.type === "data-network" && part.data?.output) {
                  // Extract output from data-network parts (agent responses)
                  messageContent += part.data.output;
                }
              }
            } else if (typeof msg.content === "string") {
              // Fallback for old format
              messageContent = msg.content;
            }

            // Skip messages with no content
            if (!messageContent) {
              return null;
            }

            // Enhanced: Split message content by <think>...</think> blocks, handling incomplete blocks
            const parts: Array<{
              type: "text" | "think";
              content: string;
              thinkKey?: string;
            }> = [];
            const regex = /<think>([\s\S]*?)(<\/think>|$)/g;
            let lastIndex = 0;
            let match;
            while ((match = regex.exec(messageContent)) !== null) {
              if (match.index > lastIndex) {
                parts.push({
                  type: "text",
                  content: messageContent.slice(lastIndex, match.index),
                });
              }
              // Use the start index of the <think> block as a stable key
              parts.push({
                type: "think",
                content: match[1],
                thinkKey: `${msg.id}-${match.index}`,
              });
              lastIndex = regex.lastIndex;
              if (match[2] !== "</think>") break;
            }
            if (lastIndex < messageContent.length) {
              parts.push({
                type: "text",
                content: messageContent.slice(lastIndex),
              });
            }
            // Determine if this is the last message and a bot message and AI is thinking (streaming)
            const isStreamingBotMsg =
              status === "streaming" &&
              idx === arr.length - 1 &&
              msg.role === "assistant";
            return (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-3 py-2 rounded-lg max-w-[70%] text-sm whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {/* Agent Activity - Collapsible (Collapsed by Default) */}
                  {msg.role === "assistant" &&
                    msg.agentActivity &&
                    msg.agentActivity.length > 0 && (
                      <Collapsible
                        label={`🤖 Agent Activity (${msg.agentActivity.length} events)`}
                        open={collapsibleOpen[`activity-${msg.id}`] === true}
                        onToggle={() => {
                          setCollapsibleOpen(
                            (prev: Record<string, boolean>) => ({
                              ...prev,
                              [`activity-${msg.id}`]:
                                !prev[`activity-${msg.id}`],
                            })
                          );
                        }}
                      >
                        <div className="space-y-1">
                          {msg.agentActivity.map(
                            (
                              activity: {
                                type: string;
                                agent: string;
                                timestamp: number;
                              },
                              idx: number
                            ) => {
                              const friendlyName = formatAgentName(
                                activity.agent
                              );
                              let icon = "🤖";
                              let text = "";

                              if (activity.type === "start") {
                                icon = "▶️";
                                text = `${friendlyName} started`;
                              } else if (activity.type === "finish") {
                                icon = "✅";
                                text = `${friendlyName} completed`;
                              } else if (activity.type === "delegation") {
                                icon = "🔄";
                                text = `Delegated to ${friendlyName}`;
                              }

                              return (
                                <div
                                  key={idx}
                                  className="text-xs flex items-start gap-1"
                                >
                                  <span>{icon}</span>
                                  <span>{text}</span>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </Collapsible>
                    )}

                  {/* Message Content */}
                  {parts.map((part, partIdx) =>
                    part.type === "think" ? (
                      <Collapsible
                        key={part.thinkKey}
                        label="AI internal reasoning"
                        open={
                          isStreamingBotMsg
                            ? true
                            : !!collapsibleOpen[part.thinkKey!]
                        }
                        onToggle={() => {
                          if (!isStreamingBotMsg) {
                            setCollapsibleOpen(
                              (prev: Record<string, boolean>) => ({
                                ...prev,
                                [part.thinkKey!]: !prev[part.thinkKey!],
                              })
                            );
                          }
                        }}
                        forceOpenNoToggle={isStreamingBotMsg}
                      >
                        {part.content.trim()}
                      </Collapsible>
                    ) : (
                      part.content && <span key={partIdx}>{part.content}</span>
                    )
                  )}
                </div>
              </div>
            );
          })}
          {/* AI typing indicator with agent status - COMPACT */}
          {status === "streaming" && (
            <div className="flex justify-start">
              <div className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 border border-gray-300">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block">
                    <span className="dot-typing">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </span>
                  </span>
                  {agentStatus && (
                    <span className="font-medium">{agentStatus}</span>
                  )}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-red-600 text-xs">
            <span>Error: {error?.message || "Failed to send message"}</span>
          </div>
        )}

        <form
          onSubmit={handleFormSubmit}
          className="p-4 border-t flex gap-2"
          style={{ minWidth: chatWidth }}
        >
          <input
            type="text"
            className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Ask the AI..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Button type="submit" disabled={status === "streaming"}>
            Send
          </Button>
        </form>
      </aside>
    </>
  );
}
